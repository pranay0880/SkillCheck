"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runCode, type RunOutcome } from "@/lib/code-runner";
import type { Level, McqOption, QuestionType, TestCase } from "@/lib/types";
import { SKILLS, type Skill } from "@/data/skills";
import { saveQuestion } from "../../actions";

export interface QuestionFormValue {
  type: QuestionType;
  title: string;
  prompt: string;
  level: Level;
  skill: Skill | "";
  points: number;
  options: McqOption[];
  correctOptionIds: string[];
  functionName: string;
  starterCode: string;
  testCases: TestCase[];
  markingGuide: string;
}

interface CaseDraft {
  key: string;
  args: string;
  expected: string;
  hidden: boolean;
}

const EMPTY: QuestionFormValue = {
  type: "mcq",
  title: "",
  prompt: "",
  level: "fresher",
  skill: "",
  points: 1,
  options: [
    { id: "a", text: "" },
    { id: "b", text: "" },
  ],
  correctOptionIds: [],
  functionName: "solve",
  starterCode: "function solve(input) {\n  \n}\n",
  testCases: [{ args: [], expected: null, hidden: false }],
  markingGuide: "",
};

let keySeed = 0;
const nextKey = () => `k${++keySeed}`;

function toDraft(testCase: TestCase): CaseDraft {
  return {
    key: nextKey(),
    args: JSON.stringify(testCase.args),
    expected: JSON.stringify(testCase.expected),
    hidden: testCase.hidden,
  };
}

function parseCases(drafts: CaseDraft[]): { cases?: TestCase[]; error?: string } {
  const cases: TestCase[] = [];
  for (const [index, draft] of drafts.entries()) {
    try {
      const args: unknown = JSON.parse(draft.args);
      if (!Array.isArray(args)) return { error: `Test case ${index + 1}: arguments must be a JSON array, e.g. [[1,2,3]] or ["hello"].` };
      const expected: unknown = JSON.parse(draft.expected);
      cases.push({ args, expected, hidden: draft.hidden });
    } catch {
      return { error: `Test case ${index + 1}: arguments or expected value is not valid JSON.` };
    }
  }
  return { cases };
}

function nextOptionId(options: McqOption[]): string {
  for (let code = 97; code < 97 + 26; code++) {
    const id = String.fromCharCode(code);
    if (!options.some((option) => option.id === id)) return id;
  }
  return `o${options.length}`;
}

interface QuestionFormProps {
  id?: string;
  initial?: QuestionFormValue;
}

export function QuestionForm(props: QuestionFormProps) {
  const [version, setVersion] = useState(0);
  return <QuestionFormBody key={version} {...props} onCreated={() => setVersion((value) => value + 1)} />;
}

function QuestionFormBody({ id, initial, onCreated }: QuestionFormProps & { onCreated: () => void }) {
  const start = initial ?? EMPTY;
  const router = useRouter();
  const formId = useId();
  const [type, setType] = useState<QuestionType>(start.type);
  const [title, setTitle] = useState(start.title);
  const [prompt, setPrompt] = useState(start.prompt);
  const [level, setLevel] = useState<Level>(start.level);
  const [skill, setSkill] = useState<Skill | "">(start.skill);
  const [points, setPoints] = useState(start.points);
  const [options, setOptions] = useState<McqOption[]>(start.options.length ? start.options : EMPTY.options);
  const [correct, setCorrect] = useState<string[]>(start.correctOptionIds);
  const [functionName, setFunctionName] = useState(start.functionName || EMPTY.functionName);
  const [starterCode, setStarterCode] = useState(start.starterCode || EMPTY.starterCode);
  const [cases, setCases] = useState<CaseDraft[]>((start.testCases.length ? start.testCases : EMPTY.testCases).map(toDraft));
  const [markingGuide, setMarkingGuide] = useState(start.markingGuide);
  const [solution, setSolution] = useState("");
  const [trial, setTrial] = useState<RunOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updateCase = (key: string, patch: Partial<CaseDraft>) =>
    setCases((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const runTrial = async () => {
    const parsed = parseCases(cases);
    if (parsed.error || !parsed.cases) {
      setError(parsed.error ?? "Invalid test cases.");
      return;
    }
    setError(null);
    setTrial(await runCode(solution || starterCode, functionName, parsed.cases));
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const base = { title, prompt, level, skill, points: Number(points) };
    let payload: unknown;
    if (type === "mcq") {
      payload = { ...base, type, options, correctOptionIds: correct };
    } else if (type === "text") {
      payload = { ...base, type, markingGuide };
    } else {
      const parsed = parseCases(cases);
      if (parsed.error) {
        setError(parsed.error);
        return;
      }
      payload = { ...base, type, functionName, starterCode, testCases: parsed.cases };
    }
    startTransition(async () => {
      const result = await saveQuestion(id ?? null, payload);
      if (!result.ok) {
        setError(result.message ?? "Could not save.");
        return;
      }
      router.push("/admin/questions");
      router.refresh();
      if (!id) onCreated();
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      {error && (
        <p role="alert" className="alert alert-error">
          {error}
        </p>
      )}

      {!id && (
        <fieldset>
          <legend>Question type</legend>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2">
              <input type="radio" name="type" checked={type === "mcq"} onChange={() => setType("mcq")} />
              Multiple choice
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="type" checked={type === "text"} onChange={() => setType("text")} />
              Written answer
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="type" checked={type === "code"} onChange={() => setType("code")} />
              Coding (JavaScript)
            </label>
          </div>
        </fieldset>
      )}

      <div className="field">
        <label className="label" htmlFor={`${formId}-title`}>
          Title
        </label>
        <input id={`${formId}-title`} type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <span className="hint">Shown to you in lists, and to the developer as the question heading.</span>
      </div>

      <div className="field">
        <label className="label" htmlFor={`${formId}-prompt`}>
          Question
        </label>
        <textarea
          id={`${formId}-prompt`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          className="font-mono text-[13px]"
          required
        />
        <span className="hint">Line breaks and code snippets are kept as written.</span>
      </div>

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
        <div className="field">
          <label className="label" htmlFor={`${formId}-level`}>
            Level
          </label>
          <select id={`${formId}-level`} value={level} onChange={(e) => setLevel(e.target.value as Level)}>
            <option value="fresher">Fresher</option>
            <option value="junior">Junior (1–2 years)</option>
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor={`${formId}-skill`}>
            Skill
          </label>
          <select id={`${formId}-skill`} value={skill} onChange={(e) => setSkill(e.target.value as Skill | "")} required>
            <option value="">Choose a skill</option>
            {SKILLS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor={`${formId}-points`}>
            Points
          </label>
          <input
            id={`${formId}-points`}
            type="number"
            min={1}
            max={100}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            required
          />
        </div>
      </div>

      {type === "text" && (
        <div className="field">
          <label className="label" htmlFor={`${formId}-guide`}>
            Marking guide (admins only)
          </label>
          <textarea
            id={`${formId}-guide`}
            rows={7}
            value={markingGuide}
            onChange={(e) => setMarkingGuide(e.target.value)}
            aria-describedby={`${formId}-guide-hint`}
            placeholder={"Key points for full marks, e.g.\n• Point 1 (1 mark)\n• Point 2 (1 mark)\n• Example (1 mark)"}
          />
          <span id={`${formId}-guide-hint`} className="hint">
            Shown next to the developer&apos;s answer when you mark it. Never shown to the developer.
          </span>
        </div>
      )}

      {type === "mcq" && (
        <fieldset>
          <legend>Options (tick every correct answer)</legend>
          <p className="hint mb-3">Tick more than one to make it a “select all that apply” question. Scoring is all-or-nothing.</p>
          <ul className="mb-3 flex flex-col gap-2">
            {options.map((option, index) => (
              <li key={option.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0"
                  aria-label={`Option ${index + 1} is correct`}
                  checked={correct.includes(option.id)}
                  onChange={(e) =>
                    setCorrect((current) =>
                      e.target.checked ? [...current, option.id] : current.filter((value) => value !== option.id),
                    )
                  }
                />
                <input
                  type="text"
                  aria-label={`Option ${index + 1} text`}
                  value={option.text}
                  onChange={(e) =>
                    setOptions((current) =>
                      current.map((item) => (item.id === option.id ? { ...item, text: e.target.value } : item)),
                    )
                  }
                />
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={options.length <= 2}
                  onClick={() => {
                    setOptions((current) => current.filter((item) => item.id !== option.id));
                    setCorrect((current) => current.filter((value) => value !== option.id));
                  }}
                  aria-label={`Remove option ${index + 1}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-sm"
            disabled={options.length >= 8}
            onClick={() => setOptions((current) => [...current, { id: nextOptionId(current), text: "" }])}
          >
            Add option
          </button>
        </fieldset>
      )}

      {type === "code" && (
        <>
          <div className="field">
            <label className="label" htmlFor={`${formId}-fn`}>
              Function name
            </label>
            <input
              id={`${formId}-fn`}
              type="text"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              className="font-mono"
              required
            />
            <span className="hint">The developer must define a function with exactly this name. It is called with each test case’s arguments.</span>
          </div>
          <div className="field">
            <label className="label" htmlFor={`${formId}-starter`}>
              Starter code
            </label>
            <textarea
              id={`${formId}-starter`}
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
              rows={6}
              className="font-mono text-[13px]"
            />
          </div>

          <fieldset>
            <legend>Test cases</legend>
            <p className="hint mb-3">
              Arguments are a JSON array of the values passed to the function, e.g. <code>[[1, 2, 3]]</code> for one array
              argument or <code>[&quot;a&quot;, 2]</code> for two arguments. Expected is any JSON value. Visible cases are
              shown to the developer; hidden cases are only used for grading.
            </p>
            <ul className="mb-3 flex flex-col gap-3">
              {cases.map((item, index) => (
                <li key={item.key} className="rounded-md border border-line p-3">
                  <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                    <div className="field mb-2">
                      <label className="label" htmlFor={`${item.key}-args`}>
                        Case {index + 1} arguments
                      </label>
                      <input
                        id={`${item.key}-args`}
                        type="text"
                        className="font-mono"
                        value={item.args}
                        onChange={(e) => updateCase(item.key, { args: e.target.value })}
                      />
                    </div>
                    <div className="field mb-2">
                      <label className="label" htmlFor={`${item.key}-expected`}>
                        Expected result
                      </label>
                      <input
                        id={`${item.key}-expected`}
                        type="text"
                        className="font-mono"
                        value={item.expected}
                        onChange={(e) => updateCase(item.key, { expected: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={item.hidden}
                        onChange={(e) => updateCase(item.key, { hidden: e.target.checked })}
                      />
                      Hidden from developer
                    </label>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={cases.length <= 1}
                      onClick={() => setCases((current) => current.filter((c) => c.key !== item.key))}
                    >
                      Remove case
                    </button>
                  </div>
                  {trial?.results[index] && (
                    <p className={`mt-2 text-sm ${trial.results[index].passed ? "text-success" : "text-danger"}`}>
                      {trial.results[index].passed ? "Passed" : `Failed${trial.results[index].error ? `: ${trial.results[index].error}` : ""}`}
                      {trial.results[index].actual !== undefined && ` · got ${trial.results[index].actual}`}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setCases((current) => [...current, { key: nextKey(), args: "[]", expected: "null", hidden: true }])}
            >
              Add test case
            </button>
          </fieldset>

          <details className="mb-4 rounded-md border border-line p-3">
            <summary className="cursor-pointer font-semibold">Check your test cases with a reference solution</summary>
            <p className="hint my-2">
              Paste a correct solution and run it. Every case should pass; if one fails, the case is probably wrong. The
              solution is not saved.
            </p>
            <label className="sr-only" htmlFor={`${formId}-solution`}>
              Reference solution
            </label>
            <textarea
              id={`${formId}-solution`}
              rows={8}
              className="mb-2 font-mono text-[13px]"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder={`function ${functionName}(...) {\n  ...\n}`}
            />
            <button type="button" className="btn btn-sm" onClick={runTrial}>
              Run against all cases
            </button>
            {trial && (
              <p role="status" className="mt-2 text-sm">
                {trial.fatalError ?? `${trial.results.filter((r) => r.passed).length} of ${trial.results.length} cases passed.`}
              </p>
            )}
          </details>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : id ? "Save changes" : "Create question"}
        </button>
        <button className="btn" type="button" onClick={() => router.push("/admin/questions")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
