import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { resultsCol, testsCol } from "@/lib/db";
import { toObjectId } from "@/lib/ids";
import { loadOrderedQuestions } from "@/lib/candidate";
import { formatDateTime, formatDuration } from "@/lib/format";
import { effectiveScore, summarize } from "@/lib/scoring";
import {
  MEMBER_STATUS_LABEL,
  QUESTION_TYPES,
  type AnswerRecord,
  type CodeQuestionDoc,
  type McqQuestionDoc,
  type QuestionDoc,
} from "@/lib/types";
import { integrityRows } from "@/components/IntegrityFlags";
import { Loading, TYPE_LABEL } from "@/components/ui";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Assessment report" };

export default function ReportPage({ params }: PageProps<"/admin/report/[id]">) {
  return (
    <main id="main" className="report mx-auto max-w-4xl bg-surface px-4 py-6 sm:px-8 print:max-w-none print:p-0">
      <Suspense fallback={<Loading label="Loading report…" />}>
        <Report params={params} />
      </Suspense>
    </main>
  );
}

function fileNameFor(name: string, testTitle: string): string {
  return `${name} - ${testTitle} - SkillCheck report`.replaceAll(/[\\/:*?"<>|]+/g, " ").replaceAll(/\s+/g, " ").trim();
}

function sectionTotals(questions: QuestionDoc[], answers: Record<string, AnswerRecord>) {
  return QUESTION_TYPES.map((type) => {
    const ofType = questions.filter((question) => question.type === type);
    const earned = ofType.reduce((sum, question) => sum + (effectiveScore(answers[String(question._id)]) ?? 0), 0);
    const max = ofType.reduce((sum, question) => sum + question.points, 0);
    const pending = ofType.filter((question) => effectiveScore(answers[String(question._id)]) === null).length;
    return { type, count: ofType.length, earned: Math.round(earned * 100) / 100, max, pending };
  }).filter((section) => section.count > 0);
}

async function Report({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const objectId = toObjectId(id);
  const member = objectId ? await (await resultsCol()).findOne({ _id: objectId }) : null;
  if (!member) notFound();
  const test = await (await testsCol()).findOne({ _id: member.testId }, { projection: { title: 1 } });
  const testTitle = test?.title ?? "Deleted test";
  const questions = await loadOrderedQuestions(member);
  const score = summarize(questions, member.answers);
  const sections = sectionTotals(questions, member.answers);
  const submitted = member.status === "submitted";
  const started = member.status !== "invited";

  const details = [
    { label: "Employee ID", value: member.employeeId ?? "—" },
    { label: "Role", value: member.role ?? "—" },
    { label: "Email", value: member.email },
    { label: "Test", value: testTitle },
    { label: "Status", value: MEMBER_STATUS_LABEL[member.status] },
    { label: "Time taken", value: formatDuration(member.startedAt, member.submittedAt) },
    { label: "Started", value: formatDateTime(member.startedAt) },
    { label: "Submitted", value: formatDateTime(member.submittedAt) },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 p-3 print:hidden">
        <Link href={`/admin/results/${id}`} className="text-sm">
          ← Back to review
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted">In the print window, choose “Save as PDF”.</span>
          <PrintButton fileName={fileNameFor(member.name, testTitle)} />
        </div>
      </div>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-2 border-b-2 border-fg pb-3">
        <div>
          <p className="m-0 text-sm font-semibold uppercase tracking-wide text-muted">SkillCheck · Assessment report</p>
          <h1 className="m-0 mt-1 text-2xl">{member.name}</h1>
        </div>
        <p className="m-0 text-sm text-muted">Generated {formatDateTime(new Date())}</p>
      </header>

      <section aria-labelledby="details" className="mb-6 break-inside-avoid">
        <h2 id="details" className="sr-only">
          Details
        </h2>
        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4 print:grid-cols-4">
          {details.map((item) => (
            <div key={item.label}>
              <dt className="text-muted">{item.label}</dt>
              <dd className="m-0 break-words font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
        {member.skills && member.skills.length > 0 && (
          <p className="m-0 mt-3 text-sm">
            <span className="text-muted">Skills required: </span>
            {member.skills.join(", ")}
          </p>
        )}
      </section>

      <section aria-labelledby="summary" className="mb-6 break-inside-avoid">
        <h2 id="summary" className="mb-3 text-lg">
          Summary
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr] print:grid-cols-[1fr_2fr]">
          <div className="rounded-xl border border-line p-4">
            <p className="m-0 text-sm text-muted">Total score</p>
            <p className="m-0 text-3xl font-bold">
              {submitted ? `${score.earned} / ${score.max}` : "—"}
            </p>
            <p className="m-0 text-sm text-muted">{submitted ? `${score.percent}%` : "Not submitted yet"}</p>
          </div>
          <table className="report-table text-sm">
            <caption className="sr-only">Score by section</caption>
            <thead>
              <tr>
                <th scope="col">Section</th>
                <th scope="col">Questions</th>
                <th scope="col">Marks</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={section.type}>
                  <th scope="row" className="font-normal">
                    {TYPE_LABEL[section.type]}
                  </th>
                  <td>{section.count}</td>
                  <td>
                    {section.earned} / {section.max}
                    {submitted && section.pending > 0 && <span className="text-muted"> ({section.pending} not graded)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {submitted && (score.pendingCodeGrading || score.pendingWrittenCount > 0) && (
          <p className="m-0 mt-3 text-sm text-warning">
            Some answers are not graded yet, so this score may go up once marking is finished.
          </p>
        )}
      </section>

      {member.overallComment && (
        <section
          aria-labelledby="overall-comment"
          className="mb-6 break-inside-avoid rounded-md border border-l-4 border-[#c7d2fe] border-l-[#3b5bdb] bg-[#eef2ff] px-4 py-3"
        >
          <h2 id="overall-comment" className="mb-2 text-lg text-[#2b44a8]">
            Examiner&apos;s comment
          </h2>
          <p className="m-0 whitespace-pre-wrap text-[15px] leading-relaxed text-[#1f2937]">{member.overallComment}</p>
        </section>
      )}

      <section aria-labelledby="integrity" className="mb-6 break-inside-avoid">
        <h2 id="integrity" className="mb-2 text-lg">
          Integrity
        </h2>
        {started ? (
          <>
            <ul className="m-0 flex list-none flex-wrap gap-x-8 gap-y-1 p-0 text-sm">
              {integrityRows(member).map((row) => (
                <li key={row.key}>
                  {row.label}: <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
            {member.fullscreenUnsupported && (
              <p className="m-0 mt-2 text-sm text-muted">The device did not support fullscreen, so it was not enforced.</p>
            )}
          </>
        ) : (
          <p className="m-0 text-sm text-muted">The test has not been started.</p>
        )}
      </section>

      <section aria-labelledby="answers">
        <h2 id="answers" className="mb-3 text-lg">
          Answers
        </h2>
        <ol className="m-0 list-none space-y-4 p-0">
          {questions.map((question, position) => {
            const questionId = String(question._id);
            const answer = member.answers[questionId];
            const earned = effectiveScore(answer);
            return (
              <li key={questionId} className="break-inside-avoid rounded-xl border border-line p-4">
                <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                  <h3 className="m-0 text-base">
                    {position + 1}. {question.title}
                  </h3>
                  <strong className="text-sm">
                    {earned === null ? "Not graded" : earned} / {question.points}
                  </strong>
                </div>
                <p className="m-0 mb-2 text-[13px] text-muted">
                  {TYPE_LABEL[question.type]} · {question.skill} · {question.level === "junior" ? "Junior" : "Fresher"}
                </p>
                <p className="m-0 mb-3 whitespace-pre-wrap text-sm">{question.prompt}</p>
                {question.type === "mcq" && <McqAnswer question={question} answer={answer} />}
                {question.type === "code" && <CodeAnswer question={question} answer={answer} />}
                {question.type === "text" &&
                  (answer?.text?.trim() ? (
                    <div className="whitespace-pre-wrap rounded-md border border-line bg-surface-2 p-3 text-sm">{answer.text}</div>
                  ) : (
                    <p className="m-0 text-sm font-semibold text-danger">Not answered</p>
                  ))}
                {answer?.reviewerNote && (
                  <p className="m-0 mt-3 text-sm">
                    <span className="font-semibold">Reviewer note: </span>
                    {answer.reviewerNote}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <footer className="mt-8 border-t border-line pt-3 text-xs text-muted">
        SkillCheck internal assessment report for {member.name}. Confidential.
      </footer>
    </>
  );
}

function McqAnswer({ question, answer }: { question: McqQuestionDoc; answer: AnswerRecord | undefined }) {
  const selected = answer?.selectedOptionIds ?? [];
  return (
    <>
      {selected.length === 0 && <p className="m-0 mb-2 text-sm font-semibold text-danger">Not answered</p>}
      <ul className="m-0 list-none space-y-1 p-0 text-sm">
        {question.options.map((option) => {
          const isCorrect = question.correctOptionIds.includes(option.id);
          const isChosen = selected.includes(option.id);
          let tone = "border-line";
          if (isCorrect) tone = "border-success bg-success-soft";
          else if (isChosen) tone = "border-danger bg-danger-soft";
          const tags = [isChosen ? "Chosen" : null, isCorrect ? "Correct answer" : null].filter(Boolean).join(" · ");
          return (
            <li key={option.id} className={`flex flex-wrap justify-between gap-2 rounded-md border px-3 py-1.5 ${tone}`}>
              <span className="whitespace-pre-wrap">{option.text}</span>
              {tags && <span className="font-semibold">{tags}</span>}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function CodeAnswer({ question, answer }: { question: CodeQuestionDoc; answer: AnswerRecord | undefined }) {
  if (!answer?.code?.trim()) return <p className="m-0 text-sm font-semibold text-danger">No code submitted</p>;
  const results = answer.caseResults ?? [];
  const passed = results.filter((result) => result.passed).length;
  return (
    <>
      <pre className="report-code">{answer.code}</pre>
      <p className="m-0 text-sm font-semibold">
        {results.length > 0 ? `${passed} of ${results.length} test cases passed` : "Test cases not run yet"}
      </p>
      {results.length > 0 && (
        <ul className="m-0 mt-1 list-none space-y-0.5 p-0 text-[13px]">
          {question.testCases.map((testCase, position) => {
            const result = results[position];
            return (
              <li key={position} className="break-words">
                <span className={result?.passed ? "text-success" : "text-danger"}>{result?.passed ? "Passed" : "Failed"}</span>{" "}
                <code>
                  {question.functionName}({testCase.args.map((arg) => JSON.stringify(arg)).join(", ")})
                </code>{" "}
                → <code>{JSON.stringify(testCase.expected)}</code>
                {testCase.hidden && <span className="text-muted"> (hidden)</span>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
