import { promises as dnsPromises, setServers } from "node:dns";
import { MongoClient, type ObjectId } from "mongodb";
import { ASSESSMENT_SETS } from "../src/data/assessment-sets.ts";

const uri = process.env.MONGODB_URI;
if (!uri) {
  process.stderr.write("MONGODB_URI is not set. Run with: npm run seed:assessments\n");
  process.exit(1);
}

const dnsOverride = process.env.MONGODB_DNS_SERVERS?.split(",")
  .map((server) => server.trim())
  .filter(Boolean);
if (dnsOverride?.length) {
  setServers(dnsOverride);
  dnsPromises.setServers(dnsOverride);
}

const client = await new MongoClient(uri).connect();
try {
  const db = client.db(process.env.MONGODB_DB ?? "skilltest");
  const questions = db.collection("questions");
  const tests = db.collection("tests");

  for (const set of ASSESSMENT_SETS) {
    const now = new Date();
    const titles = set.questions.map((question) => question.title);
    const existing = await questions.find({ title: { $in: titles } }, { projection: { title: 1 } }).toArray();
    const idByTitle = new Map<string, ObjectId>(existing.map((doc) => [doc.title as string, doc._id]));

    const missing = set.questions.filter((question) => !idByTitle.has(question.title));
    if (missing.length > 0) {
      const inserted = await questions.insertMany(missing.map((question) => ({ ...question, createdAt: now, updatedAt: now })));
      missing.forEach((question, index) => idByTitle.set(question.title, inserted.insertedIds[index]));
    }

    const existingTest = await tests.findOne({ title: set.title }, { projection: { _id: 1, questionIds: 1, description: 1 } });
    let testNote = "test already up to date";
    if (existingTest) {
      const current = new Set((existingTest.questionIds as ObjectId[]).map(String));
      const toAppend = titles.map((title) => idByTitle.get(title)).filter((id): id is ObjectId => !!id && !current.has(String(id)));
      const description = existingTest.description as string;
      const isOldAutoText = description.includes("Section 2 (Q16–Q25)") && !description.includes("Section 3");
      if (toAppend.length > 0 || isOldAutoText) {
        await tests.updateOne(
          { _id: existingTest._id },
          {
            $set: {
              questionIds: [...(existingTest.questionIds as ObjectId[]), ...toAppend],
              updatedAt: now,
              ...(isOldAutoText ? { description: set.description } : {}),
            },
          },
        );
        testNote = `test updated: ${toAppend.length} question(s) appended${isOldAutoText ? ", instructions updated" : ""}`;
      }
    } else {
      await tests.insertOne({
        title: set.title,
        description: set.description,
        durationMinutes: set.durationMinutes,
        questionIds: titles.map((title) => idByTitle.get(title)),
        shuffleQuestions: false,
        orderMode: "sections",
        shuffleOptions: true,
        requireFullscreen: true,
        createdAt: now,
        updatedAt: now,
      });
      testNote = "test created";
    }

    process.stdout.write(
      `${set.code}  ${set.title}\n      questions: ${missing.length} added, ${set.questions.length - missing.length} already present · ${testNote}\n`,
    );
  }
} finally {
  await client.close();
}
