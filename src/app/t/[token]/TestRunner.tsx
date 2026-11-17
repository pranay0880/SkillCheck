"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { CodeEditor } from "@/components/CodeEditor";
import { runCode, type RunOutcome } from "@/lib/code-runner";
import {
  TEXT_ANSWER_MAX_LENGTH,
  type PublicCodeQuestion,
  type PublicMcqQuestion,
  type PublicQuestion,
  type PublicTextQuestion,
} from "@/lib/types";
import {
  claimSession,
  recordFullscreenExit,
  recordFullscreenUnsupported,
  recordTabSwitch,
  saveAnswer,
  submitTest,
} from "../actions";

const HEARTBEAT_MS = 20 * 1000;

function subscribeFullscreen(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

function useIsFullscreen(): boolean {
  return useSyncExternalStore(
    subscribeFullscreen,
    () => Boolean(document.fullscreenElement),
    () => true,
  );
}

function useFullscreenSupported(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => Boolean(document.fullscreenEnabled),
    () => true,
  );
}

function tabSessionId(token: string): string {
  const key = `skillcheck-session-${token}`;
  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.sessionStorage.setItem(key, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

export function enterFullscreen(): void {
  if (document.fullscreenEnabled && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => undefined);
  }
}

export interface SavedAnswer {
  selectedOptionIds?: string[];
  code?: string;
  text?: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const CODE_SAVE_DELAY_MS = 1200;
const LOW_TIME_MS = 5 * 60 * 1000;

export interface PreviewKey {
  correctOptionIds?: string[];
  markingGuide?: string;
  hiddenCaseCount?: number;
}

export interface PreviewOptions {
  answerKey: Record<string, PreviewKey>;
  exitHref: string;
  shuffled: boolean;
}

interface TestRunnerProps {
  token: string;
  testTitle: string;
  questions: PublicQuestion[];
  initialAnswers: Record<string, SavedAnswer>;
  deadline: string;
  serverNow: string;
  preview?: PreviewOptions;
  requireFullscreen?: boolean;
}

function previewMcqScore(questions: PublicQuestion[], answers: Record<string, SavedAnswer>, key: Record<string, PreviewKey>) {
  let earned = 0;
  let max = 0;
  for (const question of questions) {
    if (question.type !== "mcq") continue;
    max += question.points;
    const correct = key[question.id]?.correctOptionIds ?? [];
    const chosen = answers[question.id]?.selectedOptionIds ?? [];
    if (correct.length === chosen.length && correct.every((id) => chosen.includes(id))) earned += question.points;
  }
  return { earned, max };
}

function isAnswered(question: PublicQuestion, answer: SavedAnswer | undefined): boolean {
  if (!answer) return false;
  if (question.type === "mcq") return (answer.selectedOptionIds?.length ?? 0) > 0;
  if (question.type === "text") return Boolean(answer.text?.trim());
  return Boolean(answer.code?.trim()) && answer.code?.trim() !== question.starterCode.trim();
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function TestRunner({
  token,
  testTitle,
  questions,
  initialAnswers,
  deadline,
  serverNow,
  preview,
  requireFullscreen = false,
}: TestRunnerProps) {
  const router = useRouter();
  const isPreview = Boolean(preview);
  const sessionRef = useRef("");
  const wasFullscreen = useRef(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const isFullscreen = useIsFullscreen();
  const fullscreenSupported = useFullscreenSupported();
  const enforceFullscreen = requireFullscreen && !isPreview && fullscreenSupported;
  const [showAnswers, setShowAnswers] = useState(false);
  const [previewResult, setPreviewResult] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>(initialAnswers);
  const [index, setIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tabWarning, setTabWarning] = useState(false);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const latest = useRef(answers);
  const submittedRef = useRef(false);

  const updateAnswer = (questionId: string, answer: SavedAnswer) => {
    latest.current = { ...latest.current, [questionId]: answer };
    setAnswers(latest.current);
  };

  const question = questions[index];
  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.id])).length;

  const persist = useCallback(
    async (questionId: string) => {
      const answer = latest.current[questionId];
      if (!answer || isPreview) return;
      let payload: SavedAnswer = { selectedOptionIds: answer.selectedOptionIds ?? [] };
      if (answer.code !== undefined) payload = { code: answer.code };
      else if (answer.text !== undefined) payload = { text: answer.text };
      setSaveState("saving");
      try {
        const result = await saveAnswer(token, sessionRef.current, questionId, payload);
        setSaveState(result.ok ? "saved" : "error");
        if (result.blocked) setBlocked(result.message ?? "This test is open somewhere else.");
        if (!result.ok && result.message === "This test is closed.") router.refresh();
      } catch {
        setSaveState("error");
      }
    },
    [token, router, isPreview],
  );

  const schedule = (questionId: string, delay: number) => {
    const existing = timers.current.get(questionId);
    if (existing) clearTimeout(existing);
    timers.current.set(
      questionId,
      setTimeout(() => {
        timers.current.delete(questionId);
        void persist(questionId);
      }, delay),
    );
  };

  const flushAll = useCallback(async () => {
    const pending = Array.from(timers.current.keys());
    for (const timer of timers.current.values()) clearTimeout(timer);
    timers.current.clear();
    await Promise.all(pending.map((questionId) => persist(questionId)));
  }, [persist]);

  const submit = useCallback(async () => {
    if (preview) {
      const { earned, max } = previewMcqScore(questions, latest.current, preview.answerKey);
      const writtenOrCode = questions.filter((q) => q.type !== "mcq").length;
      setPreviewResult(
        `Preview only, nothing was submitted. Multiple-choice score with these answers: ${earned} / ${max}.` +
          (writtenOrCode > 0 ? ` ${writtenOrCode} written or coding question(s) would be marked separately.` : ""),
      );
      return;
    }
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await flushAll();
      const result = await submitTest(token, sessionRef.current);
      if (result.blocked) setBlocked(result.message ?? "This test is open somewhere else.");
      if (!result.ok) throw new Error(result.message);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      router.refresh();
    } catch (error) {
      submittedRef.current = false;
      setSubmitting(false);
      setSubmitError(error instanceof Error && error.message ? error.message : "Could not submit. Check your connection and try again.");
    }
  }, [flushAll, router, token, preview, questions]);

  useEffect(() => {
    const offset = new Date(serverNow).getTime() - Date.now();
    const end = new Date(deadline).getTime();
    const tick = () => {
      const left = end - (Date.now() + offset);
      setRemaining(left);
      if (left <= 0 && !isPreview) void submit();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, serverNow, submit, isPreview]);

  useEffect(() => {
    if (isPreview) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && !submittedRef.current) {
        setTabWarning(true);
        void recordTabSwitch(token, sessionRef.current);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [token, isPreview]);

  useEffect(() => {
    if (isPreview) return;
    sessionRef.current = tabSessionId(token);
    let cancelled = false;
    const beat = async (firstClaim: boolean) => {
      try {
        const result = await claimSession(token, sessionRef.current, firstClaim);
        if (cancelled) return;
        if (result.blocked) setBlocked(result.message ?? "This test is open somewhere else.");
        else if (result.ok) setBlocked(null);
        else if (result.message) router.refresh();
      } catch {
        return;
      }
    };
    void beat(true);
    const interval = setInterval(() => void beat(false), HEARTBEAT_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, isPreview, router]);

  useEffect(() => {
    if (isPreview || !requireFullscreen) return;
    if (!document.fullscreenEnabled) {
      void recordFullscreenUnsupported(token);
      return;
    }
    wasFullscreen.current = Boolean(document.fullscreenElement);
    const onChange = () => {
      const now = Boolean(document.fullscreenElement);
      if (wasFullscreen.current && !now && !submittedRef.current) void recordFullscreenExit(token, sessionRef.current);
      wasFullscreen.current = now;
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [token, isPreview, requireFullscreen]);

  const setMcq = (q: PublicMcqQuestion, optionId: string, checked: boolean) => {
    const previous = latest.current[q.id]?.selectedOptionIds ?? [];
    let next = [optionId];
    if (q.multiple) {
      next = checked ? [...previous, optionId] : previous.filter((value) => value !== optionId);
    }
    updateAnswer(q.id, { selectedOptionIds: next });
    schedule(q.id, 0);
  };

  const setCode = (q: PublicCodeQuestion, code: string) => {
    updateAnswer(q.id, { code });
    schedule(q.id, CODE_SAVE_DELAY_MS);
  };

  const setText = (q: PublicTextQuestion, text: string) => {
    updateAnswer(q.id, { text });
    schedule(q.id, CODE_SAVE_DELAY_MS);
  };

  const confirmSubmit = () => {
    if (isPreview) {
      void submit();
      return;
    }
    setConfirming(true);
  };

  const unansweredCount = questions.length - answeredCount;

  const low = remaining !== null && remaining < LOW_TIME_MS;
  const key = preview?.answerKey[question.id];

  const resetPreview = () => {
    latest.current = {};
    setAnswers({});
    setIndex(0);
    setPreviewResult(null);
  };

  return (
    <>
      {preview && (
        <div className="alert alert-info mb-4 flex flex-wrap items-center justify-between gap-3" role="region" aria-label="Preview controls">
          <div>
            <p className="m-0 font-semibold">Preview mode: this is exactly what employees see. Nothing is saved.</p>
            <p className="m-0 text-sm text-muted">
              No attempt is created, tab switches are not recorded and the timer never auto-submits.
              {preview.shuffled && " This test shuffles questions and/or answer options for each employee, so their order will differ."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} />
              Show answers
            </label>
            <button type="button" className="btn btn-sm" onClick={resetPreview}>
              Clear answers
            </button>
            <a className="btn btn-sm" href={preview.exitHref}>
              Exit preview
            </a>
          </div>
        </div>
      )}
      {previewResult && (
        <p role="status" className="alert alert-success mb-4">
          {previewResult}
        </p>
      )}
      {blocked && !isPreview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-bg/95 p-4" role="alertdialog" aria-modal="true" aria-labelledby="blocked-title">
          <div className="card max-w-md text-center">
            <h2 id="blocked-title" className="mb-2">
              Test open somewhere else
            </h2>
            <p className="mb-2">{blocked}</p>
            <p className="mb-4 text-sm text-muted">This attempt has been recorded for your reviewer. Your saved answers are safe.</p>
            <p className="m-0 text-sm text-muted" role="status">
              Checking again automatically…
            </p>
          </div>
        </div>
      )}
      {enforceFullscreen && !isFullscreen && !blocked && !submitting && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-bg p-4" role="alertdialog" aria-modal="true" aria-labelledby="fullscreen-title">
          <div className="card max-w-md text-center">
            <h2 id="fullscreen-title" className="mb-2">
              Return to fullscreen
            </h2>
            <p className="mb-2">This test must be answered in fullscreen. The questions are hidden until you return.</p>
            <p className="mb-4 text-sm text-muted">
              Leaving fullscreen is recorded for your reviewer. The timer keeps running: {remaining === null ? "--:--" : formatClock(remaining)}{" "}
              left.
            </p>
            <button type="button" className="btn btn-primary" onClick={enterFullscreen} autoFocus>
              Enter fullscreen
            </button>
          </div>
        </div>
      )}
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="card md:sticky md:top-4" aria-label="Test progress">
        <p className="mb-1 text-sm text-muted">Time left</p>
        <p className={`mb-3 font-mono text-2xl font-bold ${low ? "text-danger" : ""}`} role="timer" aria-live="off">
          {remaining === null ? "--:--" : formatClock(remaining)}
        </p>
        {low && (
          <p className="mb-3 text-sm text-danger" role="status">
            Less than 5 minutes left.
          </p>
        )}
        <p className="mb-2 text-sm">
          <strong>{answeredCount}</strong> of {questions.length} answered
        </p>
        <nav aria-label="Questions">
          <ol className="mb-4 grid grid-cols-5 gap-1.5">
            {questions.map((q, position) => {
              const answered = isAnswered(q, answers[q.id]);
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(position)}
                    aria-current={position === index ? "step" : undefined}
                    aria-label={`Question ${position + 1}${answered ? ", answered" : ""}`}
                    className={`min-h-9 w-full cursor-pointer rounded-md border text-sm font-semibold aria-[current=step]:outline-2 aria-[current=step]:outline-offset-1 aria-[current=step]:outline-primary ${
                      answered ? "border-success bg-success-soft text-success" : "border-line bg-surface text-fg"
                    }`}
                  >
                    {position + 1}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        <p className="mb-3 text-[13px] text-muted" role="status" aria-live="polite">
          {isPreview && "Preview: answers are not saved"}
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "All changes saved"}
          {saveState === "error" && <span className="text-danger">Save failed. Check your connection.</span>}
        </p>
        {confirming ? (
          <div className="rounded-md border border-warning bg-warning-soft p-3" role="alertdialog" aria-labelledby="confirm-submit-title">
            <p id="confirm-submit-title" className="mb-1 font-semibold text-warning">
              Submit your test?
            </p>
            <p className="mb-3 text-sm">
              {unansweredCount > 0
                ? `${unansweredCount} question${unansweredCount === 1 ? " is" : "s are"} unanswered. `
                : "All questions are answered. "}
              You cannot change answers after submitting.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={submitting}
                onClick={() => {
                  setConfirming(false);
                  void submit();
                }}
                autoFocus
              >
                Yes, submit
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setConfirming(false)}>
                Keep working
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-primary w-full" onClick={confirmSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : isPreview ? "Submit (preview)" : "Submit test"}
          </button>
        )}
        {submitError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {submitError}
          </p>
        )}
      </aside>

      <section aria-labelledby="question-heading">
        {tabWarning && (
          <div role="alert" className="alert alert-warning flex items-start justify-between gap-3">
            <span>You left the test tab. This is recorded for your reviewer. Please stay on this page until you submit.</span>
            <button type="button" className="btn btn-sm" onClick={() => setTabWarning(false)}>
              Dismiss
            </button>
          </div>
        )}

        <div className="card">
          <p className="mb-1 text-sm text-muted">
            {testTitle} · Question {index + 1} of {questions.length} · {question.points} {question.points === 1 ? "point" : "points"}
          </p>
          <h1 id="question-heading" className="mb-3 text-xl">
            {question.title}
          </h1>
          <div className="mb-5 whitespace-pre-wrap">{question.prompt}</div>

          {question.type === "mcq" && (
            <McqAnswer
              question={question}
              selected={answers[question.id]?.selectedOptionIds ?? []}
              onChange={setMcq}
              correctOptionIds={showAnswers ? key?.correctOptionIds : undefined}
            />
          )}
          {question.type === "code" && (
            <CodeAnswer
              key={question.id}
              question={question}
              code={answers[question.id]?.code ?? question.starterCode}
              onChange={(code) => setCode(question, code)}
            />
          )}
          {question.type === "text" && (
            <TextAnswer
              key={question.id}
              question={question}
              text={answers[question.id]?.text ?? ""}
              onChange={(text) => setText(question, text)}
            />
          )}
          {showAnswers && question.type === "text" && (
            <div className="mt-4 rounded-md border border-line bg-info-soft p-3 text-sm">
              <p className="label mb-1">Marking guide (admin only)</p>
              <p className="m-0 whitespace-pre-wrap">{key?.markingGuide || "No marking guide for this question."}</p>
            </div>
          )}
          {showAnswers && question.type === "code" && (
            <p className="mt-2 rounded-md border border-line bg-info-soft p-3 text-sm">
              Admin only: graded against {question.sampleCases.length} visible + {key?.hiddenCaseCount ?? 0} hidden test cases.
            </p>
          )}
        </div>

        <div className="flex justify-between gap-2">
          <button type="button" className="btn" onClick={() => setIndex((value) => value - 1)} disabled={index === 0}>
            Previous
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setIndex((value) => value + 1)}
            disabled={index === questions.length - 1}
          >
            Next
          </button>
        </div>
      </section>
    </div>
    </>
  );
}

function TextAnswer({
  question,
  text,
  onChange,
}: {
  question: PublicTextQuestion;
  text: string;
  onChange: (text: string) => void;
}) {
  const fieldId = `answer-${question.id}`;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div className="field mb-0">
      <label className="label" htmlFor={fieldId}>
        Your answer
      </label>
      <textarea
        id={fieldId}
        rows={12}
        maxLength={TEXT_ANSWER_MAX_LENGTH}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={`${fieldId}-hint`}
        className="min-h-[240px] leading-relaxed"
        placeholder="Write your answer here. Use examples or short code snippets where they help."
      />
      <span id={`${fieldId}-hint`} className="hint">
        {words} {words === 1 ? "word" : "words"} · Saved automatically · Marked by your reviewer
      </span>
    </div>
  );
}

function McqAnswer({
  question,
  selected,
  onChange,
  correctOptionIds,
}: {
  question: PublicMcqQuestion;
  selected: string[];
  onChange: (question: PublicMcqQuestion, optionId: string, checked: boolean) => void;
  correctOptionIds?: string[];
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2 px-0">{question.multiple ? "Select all that apply" : "Choose one answer"}</legend>
      <div className="flex flex-col gap-2">
        {question.options.map((option) => (
          <label key={option.id} className="option">
            <input
              type={question.multiple ? "checkbox" : "radio"}
              name={`q-${question.id}`}
              className="mt-1 h-4 w-4 shrink-0"
              checked={selected.includes(option.id)}
              onChange={(e) => onChange(question, option.id, e.target.checked)}
            />
            <span className="flex-1 whitespace-pre-wrap">{option.text}</span>
            {correctOptionIds?.includes(option.id) && <span className="badge badge-success">Correct answer</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CodeAnswer({
  question,
  code,
  onChange,
}: {
  question: PublicCodeQuestion;
  code: string;
  onChange: (code: string) => void;
}) {
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setOutcome(await runCode(code, question.functionName, question.sampleCases));
    setRunning(false);
  };

  return (
    <>
      <p className="mb-2 text-sm text-muted">
        Write your solution in JavaScript. Keep the function name <code>{question.functionName}</code>.
      </p>
      <CodeEditor value={code} onChange={onChange} label={`Code editor for ${question.title}`} />
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button type="button" className="btn" onClick={run} disabled={running}>
          {running ? "Running…" : `Run ${question.sampleCases.length} visible test${question.sampleCases.length === 1 ? "" : "s"}`}
        </button>
        <span className="text-[13px] text-muted">Hidden tests also count towards your score.</span>
      </div>

      <div aria-live="polite">
        {outcome?.fatalError && (
          <p role="alert" className="alert alert-error">
            {outcome.fatalError}
          </p>
        )}
        {outcome && !outcome.fatalError && (
          <p className="mb-2 text-sm font-semibold">
            {outcome.results.filter((result) => result.passed).length} of {outcome.results.length} visible tests passed
          </p>
        )}
      </div>

      <ul className="mb-3 flex flex-col gap-1.5">
        {question.sampleCases.map((testCase, position) => {
          const result = outcome?.results[position];
          const tone = !result ? "border-line" : result.passed ? "border-success bg-success-soft" : "border-danger bg-danger-soft";
          return (
            <li key={position} className={`break-words rounded-md border px-3 py-2 text-sm ${tone}`}>
              <code>
                {question.functionName}({testCase.args.map((arg) => JSON.stringify(arg)).join(", ")})
              </code>{" "}
              → expected <code>{JSON.stringify(testCase.expected)}</code>
              {result && (
                <span className="block">
                  {result.passed ? "Passed" : "Failed"}
                  {result.actual !== undefined && !result.passed && (
                    <>
                      {" "}
                      · got <code>{result.actual}</code>
                    </>
                  )}
                  {result.error && <> · {result.error}</>}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {outcome && outcome.logs.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold">Console output ({outcome.logs.length})</summary>
          <pre className="mt-2 max-h-40 overflow-auto">{outcome.logs.join("\n")}</pre>
        </details>
      )}
    </>
  );
}
