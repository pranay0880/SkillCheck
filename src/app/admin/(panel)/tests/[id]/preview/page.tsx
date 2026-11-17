import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { questionsCol, testsCol } from "@/lib/db";
import { toObjectId } from "@/lib/ids";
import { toPublicQuestion } from "@/lib/candidate";
import { pluralize } from "@/lib/format";
import { resolveTestSettings } from "@/lib/types";
import { Loading } from "@/components/ui";
import { TestRunner, type PreviewKey } from "@/app/t/[token]/TestRunner";

export const metadata: Metadata = { title: "Preview test" };

export default function PreviewTestPage({ params }: PageProps<"/admin/tests/[id]/preview">) {
  return (
    <Suspense fallback={<Loading label="Loading preview…" />}>
      <Preview params={params} />
    </Suspense>
  );
}

async function Preview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const objectId = toObjectId(id);
  const test = objectId ? await (await testsCol()).findOne({ _id: objectId }) : null;
  if (!test) notFound();

  const docs = await (await questionsCol()).find({ _id: { $in: test.questionIds } }).toArray();
  const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
  const ordered = test.questionIds.map((questionId) => byId.get(String(questionId))).filter((doc) => doc !== undefined);

  if (ordered.length === 0) {
    return (
      <div className="card">
        <h1 className="mb-2 text-xl">Nothing to preview</h1>
        <p className="text-muted">
          This test has no questions. <Link href={`/admin/tests/${id}`}>Add questions</Link> first.
        </p>
      </div>
    );
  }

  const answerKey: Record<string, PreviewKey> = {};
  for (const doc of ordered) {
    const key = String(doc._id);
    if (doc.type === "mcq") answerKey[key] = { correctOptionIds: doc.correctOptionIds };
    else if (doc.type === "text") answerKey[key] = { markingGuide: doc.markingGuide };
    else answerKey[key] = { hiddenCaseCount: doc.testCases.filter((testCase) => testCase.hidden).length };
  }

  const missing = test.questionIds.length - ordered.length;
  const counts = {
    mcq: ordered.filter((doc) => doc.type === "mcq").length,
    text: ordered.filter((doc) => doc.type === "text").length,
    code: ordered.filter((doc) => doc.type === "code").length,
  };
  const breakdown = [
    counts.mcq ? `${counts.mcq} multiple choice` : null,
    counts.text ? `${counts.text} written` : null,
    counts.code ? `${counts.code} coding` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const totalMarks = ordered.reduce((sum, doc) => sum + doc.points, 0);
  const now = new Date();

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/admin/tests/${id}`}>← Back to test</Link>
      </p>
      {missing > 0 && (
        <p className="alert alert-warning">
          {missing} question{missing === 1 ? " in this test no longer exists" : "s in this test no longer exist"} and{" "}
          {missing === 1 ? "is" : "are"} skipped.
        </p>
      )}
      <details className="card">
        <summary className="cursor-pointer font-semibold">Start screen employees see before the timer starts</summary>
        <div className="mt-3">
          <h2 className="mb-2">{test.title}</h2>
          {test.description && <p className="mb-3 whitespace-pre-wrap">{test.description}</p>}
          <ul className="list-disc space-y-1 pl-5">
            <li>
              {pluralize(ordered.length, "question")} ({breakdown}) · <strong>{totalMarks} marks</strong>
            </li>
            <li>Time limit: {test.durationMinutes} minutes</li>
          </ul>
        </div>
      </details>
      <TestRunner
        token=""
        testTitle={test.title}
        questions={ordered.map((question) => toPublicQuestion(question))}
        initialAnswers={{}}
        deadline={new Date(now.getTime() + test.durationMinutes * 60 * 1000).toISOString()}
        serverNow={now.toISOString()}
        preview={{ answerKey, exitHref: `/admin/tests/${id}`, shuffled: resolveTestSettings(test).orderMode !== "fixed" || resolveTestSettings(test).shuffleOptions }}
      />
    </>
  );
}
