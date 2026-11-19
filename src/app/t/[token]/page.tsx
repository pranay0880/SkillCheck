import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Brand } from "@/components/Brand";
import { Loading } from "@/components/ui";
import { loadCandidate, loadOrderedQuestions, toPublicQuestion } from "@/lib/candidate";
import { deadlineFor } from "@/lib/scoring";
import { pluralize } from "@/lib/format";
import { isVerifiedFor } from "@/lib/candidate-session";
import { resolveTestSettings } from "@/lib/types";
import { StartPanel } from "./StartPanel";
import { VerifyPanel } from "./VerifyPanel";
import { FeedbackForm } from "./FeedbackForm";
import { TestRunner, type SavedAnswer } from "./TestRunner";

export const metadata: Metadata = { title: "Assessment", referrer: "no-referrer" };

export default function CandidatePage({ params }: PageProps<"/t/[token]">) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Brand />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 pb-12 pt-6">
        <Suspense fallback={<Loading label="Loading your test…" />}>
          <Candidate params={params} />
        </Suspense>
      </main>
    </>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card mx-auto max-w-2xl">
      <h1 className="mb-2 text-xl">{title}</h1>
      <div className="text-muted">{children}</div>
    </div>
  );
}

async function Candidate({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const context = await loadCandidate(token);
  if (!context) {
    return (
      <Notice title="Link not valid">
        <p>This test link is not valid or has been removed. Please check with the person who sent it.</p>
      </Notice>
    );
  }
  const { member, test } = context;
  const verified = await isVerifiedFor(member._id);

  if (member.status === "submitted") {
    const askFeedback = verified && !member.feedback;
    return (
      <Notice title="Test submitted">
        <p>
          {verified ? `Thanks, ${member.name}. ` : ""}The answers for “{test.title}” have been submitted. Your reviewer will share the
          results with you.
        </p>
        {askFeedback ? (
          <FeedbackForm token={token} />
        ) : (
          <>
            {member.feedback && <p className="alert alert-success mt-4">Thanks for your feedback. It helps us improve these tests.</p>}
            <Link href="/" className="btn btn-primary mt-4 no-underline">
              Go to home page
            </Link>
          </>
        )}
      </Notice>
    );
  }

  if (!verified) {
    return (
      <div className="card mx-auto max-w-md p-6">
        <h1 className="mb-1 text-xl">Verify it&apos;s you</h1>
        <p className="mb-5 text-muted">
          “{test.title}” is locked to the employee it belongs to. We will email a one-time code to that employee&apos;s address.
        </p>
        <VerifyPanel token={token} />
      </div>
    );
  }

  const questions = await loadOrderedQuestions(member);
  const codeCount = questions.filter((question) => question.type === "code").length;
  const writtenCount = questions.filter((question) => question.type === "text").length;
  const mcqCount = questions.length - codeCount - writtenCount;
  const totalMarks = questions.reduce((sum, question) => sum + question.points, 0);
  const breakdown = [
    mcqCount > 0 ? `${mcqCount} multiple choice` : null,
    writtenCount > 0 ? `${writtenCount} written` : null,
    codeCount > 0 ? `${codeCount} coding` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const settings = resolveTestSettings(test);

  if (member.status === "invited") {
    return (
      <div className="card mx-auto max-w-3xl">
        <p className="mb-1 text-sm text-muted">Hi {member.name},</p>
        <h1 className="mb-2">{test.title}</h1>
        <p className="mb-4 flex flex-wrap gap-2 text-sm">
          <span className="badge badge-info">{pluralize(questions.length, "question")}</span>
          <span className="badge">{breakdown}</span>
          <span className="badge">{totalMarks} marks</span>
          <span className="badge">{test.durationMinutes} minutes</span>
        </p>
        {test.description && <p className="mb-5 whitespace-pre-wrap">{test.description}</p>}

        <section aria-labelledby="recommendations" className="mb-5">
          <h2 id="recommendations" className="mb-2 text-base">
            Recommendations before you start
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use a laptop or desktop with the latest Chrome, Edge or Firefox. Phones and tablets are not recommended.</li>
            <li>Use a stable internet connection, and keep your laptop plugged in.</li>
            <li>Close other apps and browser tabs, and turn off notifications (for example Focus Assist / Do Not Disturb).</li>
            <li>Sit somewhere quiet where you will not be interrupted for {test.durationMinutes} minutes.</li>
            {codeCount > 0 && <li>Coding questions use JavaScript in the browser. No setup is needed.</li>}
          </ul>
        </section>

        <section aria-labelledby="guidelines" className="mb-5">
          <h2 id="guidelines" className="mb-2 text-base">
            Guidelines
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              The timer starts when you press Start and <strong>does not pause</strong>. Refreshing the page does not reset it.
            </li>
            <li>Answer in any order and change answers until you submit. Answers save automatically as you go.</li>
            {mcqCount > 0 && <li>Multiple choice: pick the single best answer unless the question says “select all that apply”.</li>}
            {writtenCount > 0 && <li>Written answers are marked by your reviewer. Explain clearly and give short examples.</li>}
            {codeCount > 0 && <li>Coding: run the visible tests to check your work. Hidden tests also count towards your score.</li>}
            <li>When time runs out, the test submits itself with whatever you have saved.</li>
            <li>You can submit only once.</li>
          </ul>
        </section>

        <section aria-labelledby="warnings" className="alert alert-warning mb-5">
          <h2 id="warnings" className="mb-2 text-base">
            Warnings: these are recorded and shared with your reviewer
          </h2>
          <ul className="m-0 list-disc space-y-1 pl-5">
            {settings.requireFullscreen && (
              <li>
                The test runs in <strong>fullscreen</strong>. Leaving fullscreen (Esc, switching windows) hides the questions
                until you return, and every exit is recorded.
              </li>
            )}
            <li>Switching to another tab or app is recorded.</li>
            <li>
              Use <strong>one device and one browser tab</strong>. Opening the test anywhere else while it is open here is
              blocked and recorded.
            </li>
            <li>Do not use other people, AI tools or online answers. Your reviewer may discuss your answers with you afterwards.</li>
          </ul>
        </section>

        <StartPanel token={token} requireFullscreen={settings.requireFullscreen} />
      </div>
    );
  }

  const answers: Record<string, SavedAnswer> = {};
  for (const [questionId, answer] of Object.entries(member.answers)) {
    answers[questionId] = { selectedOptionIds: answer.selectedOptionIds, code: answer.code, text: answer.text };
  }

  return (
    <TestRunner
      token={token}
      testTitle={test.title}
      questions={questions.map((question) => toPublicQuestion(question, settings.shuffleOptions ? String(member._id) : undefined))}
      initialAnswers={answers}
      deadline={deadlineFor(member.startedAt ?? new Date(), test.durationMinutes).toISOString()}
      serverNow={new Date().toISOString()}
      requireFullscreen={settings.requireFullscreen}
    />
  );
}
