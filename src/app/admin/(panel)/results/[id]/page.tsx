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
import type { AnswerRecord, CodeQuestionDoc, McqQuestionDoc, TextQuestionDoc } from "@/lib/types";
import { ActionButton } from "@/components/ActionButton";
import { integrityRows } from "@/components/IntegrityFlags";
import { LevelBadge, Loading, PageHead, Stat, StatusBadge } from "@/components/ui";
import { deleteMember } from "../../../actions";
import { CodeGrader, type GradeItem } from "./CodeGrader";
import { ManualScore } from "./ManualScore";
import { OverallComment } from "./OverallComment";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage({ params }: PageProps<"/admin/results/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Review params={params} />
    </Suspense>
  );
}

async function Review({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const objectId = toObjectId(id);
  const member = objectId ? await (await resultsCol()).findOne({ _id: objectId }) : null;
  if (!member) notFound();
  const test = await (await testsCol()).findOne({ _id: member.testId });
  const questions = await loadOrderedQuestions(member);
  const score = summarize(questions, member.answers);

  const gradeItems: GradeItem[] = questions
    .filter((question): question is CodeQuestionDoc => question.type === "code")
    .filter((question) => member.answers[String(question._id)]?.code?.trim())
    .map((question) => ({
      questionId: String(question._id),
      code: member.answers[String(question._id)]?.code ?? "",
      functionName: question.functionName,
      testCases: question.testCases,
    }));
  const needsGrading = member.status === "submitted" && score.pendingCodeGrading;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/results">← All results</Link>
      </p>
      <PageHead
        title={member.name}
        subtitle={
          <>
            {[member.employeeId, member.role, member.email].filter(Boolean).join(" · ")}
            <span className="block">Test: {test?.title ?? "Deleted test"}</span>
            {member.skills && member.skills.length > 0 && (
              <span className="mt-2 flex flex-wrap gap-1">
                {member.skills.map((skill) => (
                  <span key={skill} className="badge badge-info">
                    {skill}
                  </span>
                ))}
              </span>
            )}
          </>
        }
        actions={
          <>
            <Link href={`/admin/report/${id}`} className="btn no-underline">
              PDF report
            </Link>
            <ActionButton
              action={deleteMember.bind(null, id)}
              label="Delete result"
              pendingLabel="Deleting…"
              confirmText={`Delete ${member.name}'s invite and all answers? This cannot be undone.`}
              className="btn btn-danger"
            />
          </>
        }
      />

      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <Stat label="Status" value={<StatusBadge status={member.status} />} />
        <Stat
          label="Score"
          value={
            <>
              {score.earned} / {score.max} <span className="text-base font-normal text-muted">({score.percent}%)</span>
            </>
          }
        />
        <Stat label="Time taken" value={<span className="text-lg">{formatDuration(member.startedAt, member.submittedAt)}</span>} />
        {integrityRows(member).map((row) => (
          <Stat key={row.key} label={row.label} value={<span className={row.count > 3 ? "text-danger" : undefined}>{row.count}</span>} />
        ))}
      </div>
      {member.fullscreenUnsupported && (
        <p className="alert alert-info">This employee&apos;s device did not support fullscreen, so fullscreen was not enforced.</p>
      )}

      <div className="card">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Invited</dt>
            <dd className="m-0">{formatDateTime(member.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Started</dt>
            <dd className="m-0">{formatDateTime(member.startedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Submitted</dt>
            <dd className="m-0">{formatDateTime(member.submittedAt)}</dd>
          </div>
        </dl>
        {member.status === "submitted" && gradeItems.length > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            {needsGrading && (
              <p className="alert alert-info">
                Coding answers are graded in your browser when you open this page. Scores are saved automatically.
              </p>
            )}
            <CodeGrader memberId={id} items={gradeItems} autoRun={needsGrading} />
          </div>
        )}
      </div>

      {member.status !== "submitted" && (
        <p className="alert alert-info">
          This developer has not submitted yet. Answers below are what has been saved so far.
        </p>
      )}
      {member.status === "submitted" && score.pendingWrittenCount > 0 && (
        <p className="alert alert-warning">
          {score.pendingWrittenCount} written answer{score.pendingWrittenCount === 1 ? "" : "s"} still need
          {score.pendingWrittenCount === 1 ? "s" : ""} your mark. Enter a mark under each one (marked “Not graded”); the total
          updates as you save.
        </p>
      )}

      {member.status === "submitted" && (
        <OverallComment
          memberId={id}
          comment={member.overallComment}
          savedAt={member.overallCommentAt ? formatDateTime(member.overallCommentAt) : undefined}
        />
      )}

      <h2 className="mb-3 mt-6">Answers</h2>
      {questions.map((question, position) => {
        const questionId = String(question._id);
        const answer = member.answers[questionId];
        const earned = effectiveScore(answer);
        return (
          <article key={questionId} className="card" aria-labelledby={`q-${questionId}`}>
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <h3 id={`q-${questionId}`}>
                {position + 1}. {question.title}
              </h3>
              <span className="flex flex-wrap items-center gap-2 text-sm">
                <LevelBadge level={question.level} />
                <span className="badge">{question.skill}</span>
                <strong>
                  {earned === null ? "Not graded" : earned} / {question.points}
                </strong>
                {typeof answer?.manualScore === "number" && <span className="badge badge-info">Your mark</span>}
              </span>
            </div>
            <div className="mb-3 whitespace-pre-wrap text-sm text-muted">{question.prompt}</div>
            {question.type === "mcq" && <McqReview question={question} answer={answer} />}
            {question.type === "code" && <CodeReview question={question} answer={answer} />}
            {question.type === "text" && <TextReview question={question} answer={answer} />}
            {member.status === "submitted" && (
              <ManualScore
                memberId={id}
                questionId={questionId}
                points={question.points}
                autoScore={answer?.autoScore}
                manualScore={answer?.manualScore}
                note={answer?.reviewerNote}
              />
            )}
          </article>
        );
      })}
    </>
  );
}

function TextReview({ question, answer }: { question: TextQuestionDoc; answer: AnswerRecord | undefined }) {
  const text = answer?.text?.trim();
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div>
        <p className="label mb-1">Answer</p>
        {text ? (
          <div className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-line bg-surface-2 p-3 text-sm">
            {answer?.text}
          </div>
        ) : (
          <p className="text-sm font-semibold text-danger">Not answered (scored 0)</p>
        )}
      </div>
      <div>
        <p className="label mb-1">Marking guide</p>
        {question.markingGuide ? (
          <div className="whitespace-pre-wrap rounded-md border border-line bg-info-soft p-3 text-sm">{question.markingGuide}</div>
        ) : (
          <p className="text-sm text-muted">No marking guide for this question.</p>
        )}
      </div>
    </div>
  );
}

function McqReview({ question, answer }: { question: McqQuestionDoc; answer: AnswerRecord | undefined }) {
  const selected = answer?.selectedOptionIds ?? [];
  return (
    <>
      {selected.length === 0 && <p className="mb-2 text-sm font-semibold text-danger">Not answered</p>}
      <ul className="flex flex-col gap-1.5">
        {question.options.map((option) => {
          const isCorrect = question.correctOptionIds.includes(option.id);
          const isChosen = selected.includes(option.id);
          let tone = "border-line";
          if (isCorrect) tone = "border-success bg-success-soft";
          else if (isChosen) tone = "border-danger bg-danger-soft";
          return (
            <li key={option.id} className={`flex flex-wrap items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm ${tone}`}>
              <span className="whitespace-pre-wrap">{option.text}</span>
              <span className="flex gap-1">
                {isChosen && <span className="badge">Chosen</span>}
                {isCorrect && <span className="badge badge-success">Correct</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function CodeReview({ question, answer }: { question: CodeQuestionDoc; answer: AnswerRecord | undefined }) {
  if (!answer?.code?.trim()) return <p className="text-sm font-semibold text-danger">No code submitted</p>;
  const results = answer.caseResults ?? [];
  const passed = results.filter((result) => result.passed).length;
  return (
    <>
      <pre className="max-h-[420px] overflow-auto">{answer.code}</pre>
      {results.length > 0 ? (
        <>
          <p className="mb-2 text-sm font-semibold">
            {passed} of {results.length} test cases passed
          </p>
          <ul className="flex flex-col gap-1.5">
            {question.testCases.map((testCase, position) => {
              const result = results[position];
              const tone = result?.passed ? "border-success bg-success-soft" : "border-danger bg-danger-soft";
              return (
                <li key={position} className={`break-words rounded-md border px-3 py-2 text-sm ${tone}`}>
                  <code>
                    {question.functionName}({testCase.args.map((arg) => JSON.stringify(arg)).join(", ")})
                  </code>{" "}
                  → <code>{JSON.stringify(testCase.expected)}</code> {testCase.hidden && <span className="badge">Hidden</span>}
                  <span className="block">
                    {result?.passed ? "Passed" : "Failed"}
                    {result?.error && <> · {result.error}</>}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted">Not graded yet.</p>
      )}
    </>
  );
}
