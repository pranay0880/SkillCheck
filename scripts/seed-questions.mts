import { promises as dnsPromises, setServers } from "node:dns";
import { MongoClient } from "mongodb";
import { QUESTION_BANK } from "../src/data/question-bank.ts";

const uri = process.env.MONGODB_URI;
if (!uri) {
  process.stderr.write("MONGODB_URI is not set. Run with: npm run seed:questions\n");
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
  const questions = client.db(process.env.MONGODB_DB ?? "skilltest").collection("questions");
  const existing = new Set((await questions.find({}, { projection: { title: 1 } }).toArray()).map((doc) => doc.title));
  const now = new Date();
  const fresh = QUESTION_BANK.filter((question) => !existing.has(question.title)).map((question) => ({
    ...question,
    createdAt: now,
    updatedAt: now,
  }));
  if (fresh.length > 0) await questions.insertMany(fresh);
  const bySkill = await questions
    .aggregate<{ _id: string; total: number }>([{ $group: { _id: "$skill", total: { $sum: 1 } } }, { $sort: { _id: 1 } }])
    .toArray();
  process.stdout.write(`Inserted ${fresh.length} new questions (skipped ${QUESTION_BANK.length - fresh.length} already present).\n`);
  process.stdout.write(`${bySkill.map((row) => `  ${String(row._id).padEnd(26)} ${row.total}`).join("\n")}\n`);
} finally {
  await client.close();
}
