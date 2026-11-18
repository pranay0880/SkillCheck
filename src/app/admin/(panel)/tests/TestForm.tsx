"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CatalogRole, Level, OrderMode, QuestionType } from "@/lib/types";
import { sortSkills, type Skill } from "@/data/skills";
import { TYPE_LABEL } from "@/components/ui";
import { saveTest } from "../../actions";

export interface PickableQuestion {
  id: string;
  title: string;
  type: QuestionType;
  level: Level;
  skill: Skill;
  points: number;
}

export interface TestFormValue {
  title: string;
  description: string;
  durationMinutes: number;
  orderMode: OrderMode;
  shuffleOptions: boolean;
  requireFullscreen: boolean;
  questionIds: string[];
}

const EMPTY: TestFormValue = {
  title: "",
  description: "",
  durationMinutes: 45,
  orderMode: "sections",
  shuffleOptions: true,
  requireFullscreen: true,
  questionIds: [],
};

interface TestFormProps {
  id?: string;
  initial?: TestFormValue;
  questions: PickableQuestion[];
  roles: CatalogRole[];
}

export function TestForm(props: TestFormProps) {
  const [version, setVersion] = useState(0);
  return <TestFormBody key={version} {...props} onCreated={() => setVersion((value) => value + 1)} />;
}

function TestFormBody({ id, initial, questions, roles, onCreated }: TestFormProps & { onCreated: () => void }) {
  const start = initial ?? EMPTY;
  const router = useRouter();
  const [title, setTitle] = useState(start.title);
  const [description, setDescription] = useState(start.description);
  const [duration, setDuration] = useState(start.durationMinutes);
  const [orderMode, setOrderMode] = useState<OrderMode>(start.orderMode);
  const [shuffleOptions, setShuffleOptions] = useState(start.shuffleOptions);
  const [requireFullscreen, setRequireFullscreen] = useState(start.requireFullscreen);
  const [selected, setSelected] = useState<string[]>(start.questionIds);
  const [levelFilter, setLevelFilter] = useState<"" | Level>("");
  const [typeFilter, setTypeFilter] = useState<"" | QuestionType>("");
  const [skillFilter, setSkillFilter] = useState<Skill[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const roleSkills = useMemo(() => roles.find((role) => role.id === roleFilter)?.skills ?? null, [roles, roleFilter]);
  const availableSkills = useMemo(
    () => sortSkills(questions.map((q) => q.skill)).filter((skill) => !roleSkills || roleSkills.includes(skill)),
    [questions, roleSkills],
  );
  const visible = useMemo(
    () =>
      questions.filter(
        (q) =>
          (!levelFilter || q.level === levelFilter) &&
          (!typeFilter || q.type === typeFilter) &&
          (skillFilter.length > 0 ? skillFilter.includes(q.skill) : !roleSkills || roleSkills.includes(q.skill)),
      ),
    [questions, levelFilter, typeFilter, skillFilter, roleSkills],
  );
  const chosen = questions.filter((q) => selected.includes(q.id));
  const totalPoints = chosen.reduce((sum, q) => sum + q.points, 0);
  const mcqCount = chosen.filter((q) => q.type === "mcq").length;
  const writtenCount = chosen.filter((q) => q.type === "text").length;
  const codeCount = chosen.filter((q) => q.type === "code").length;
  const chosenSkills = sortSkills(chosen.map((q) => q.skill)).map((skill) => ({
    skill,
    count: chosen.filter((q) => q.skill === skill).length,
  }));

  const toggleSkill = (skill: Skill) =>
    setSkillFilter((current) => (current.includes(skill) ? current.filter((value) => value !== skill) : [...current, skill]));

  const toggle = (questionId: string, on: boolean) =>
    setSelected((current) => (on ? [...current, questionId] : current.filter((value) => value !== questionId)));

  const selectAllVisible = () => setSelected((current) => Array.from(new Set([...current, ...visible.map((q) => q.id)])));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveTest(id ?? null, {
        title,
        description,
        durationMinutes: Number(duration),
        orderMode,
        shuffleOptions,
        requireFullscreen,
        questionIds: selected,
      });
      if (!result.ok) {
        setError(result.message ?? "Could not save.");
        return;
      }
      if (id) {
        setSaved(true);
        router.refresh();
      } else {
        router.push(`/admin/tests/${result.id}`);
        onCreated();
      }
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      {error && (
        <p role="alert" className="alert alert-error">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="alert alert-success">
          Test saved. New invites use the updated question list; existing invites keep the questions they were given.
        </p>
      )}

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[1fr_180px]">
        <div className="field">
          <label className="label" htmlFor="test-title">
            Test title
          </label>
          <input id="test-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label" htmlFor="test-duration">
            Time limit (minutes)
          </label>
          <input
            id="test-duration"
            type="number"
            min={5}
            max={300}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="test-description">
          Instructions for the developer
        </label>
        <textarea
          id="test-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Answer all questions. You can switch between questions freely. Code questions use JavaScript."
        />
      </div>

      <fieldset>
        <legend>Fairness and integrity</legend>
        <div className="field mb-3 max-w-md">
          <label className="label" htmlFor="test-order">
            Question order
          </label>
          <select id="test-order" value={orderMode} onChange={(e) => setOrderMode(e.target.value as OrderMode)}>
            <option value="fixed">Fixed: same order for everyone</option>
            <option value="sections">Shuffle within sections (MCQ, written, coding stay grouped)</option>
            <option value="all">Shuffle all questions</option>
          </select>
          <span className="hint">Each person gets their own order when they first open the test.</span>
        </div>
        <label className="mb-2 flex items-start gap-2">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} />
          <span>
            Shuffle multiple-choice options for each person
            <span className="block text-[13px] text-muted">Turn off if an option says “All of the above” or similar.</span>
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={requireFullscreen}
            onChange={(e) => setRequireFullscreen(e.target.checked)}
          />
          <span>
            Require fullscreen while answering
            <span className="block text-[13px] text-muted">
              Questions are hidden outside fullscreen and every exit is logged. Skipped on devices without fullscreen support.
            </span>
          </span>
        </label>
        <p className="hint mt-3 mb-0">
          Always on: one device at a time. Opening the test in a second browser or tab while it is active is blocked and logged.
        </p>
      </fieldset>

      <fieldset>
        <legend>Questions</legend>
        <div className="field mb-3 max-w-xs">
          <label className="label" htmlFor="pick-role">
            Role
          </label>
          <select
            id="pick-role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setSkillFilter([]);
            }}
            aria-describedby="pick-role-hint"
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <span id="pick-role-hint" className="hint">
            Shows only that role&apos;s skills and questions.
          </span>
        </div>
        {availableSkills.length > 0 && (
          <div className="mb-3">
            <p id="pick-skills-label" className="label mb-1.5">
              Skills{" "}
              <span className="font-normal text-muted">
                (none selected = {roleSkills ? "all skills for this role" : "all skills"})
              </span>
            </p>
            <div role="group" aria-labelledby="pick-skills-label" className="flex flex-wrap gap-1.5">
              {availableSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  aria-pressed={skillFilter.includes(skill)}
                  onClick={() => toggleSkill(skill)}
                  className="badge cursor-pointer aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary"
                >
                  {skill}
                </button>
              ))}
              {skillFilter.length > 0 && (
                <button type="button" className="badge cursor-pointer underline" onClick={() => setSkillFilter([])}>
                  Clear skills
                </button>
              )}
            </div>
          </div>
        )}
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="label mb-1 block" htmlFor="pick-level">
              Level
            </label>
            <select id="pick-level" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as "" | Level)}>
              <option value="">All levels</option>
              <option value="fresher">Fresher</option>
              <option value="junior">Junior</option>
            </select>
          </div>
          <div>
            <label className="label mb-1 block" htmlFor="pick-type">
              Type
            </label>
            <select id="pick-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "" | QuestionType)}>
              <option value="">All types</option>
              <option value="mcq">Multiple choice</option>
              <option value="text">Written</option>
              <option value="code">Coding</option>
            </select>
          </div>
          <button type="button" className="btn btn-sm" onClick={selectAllVisible}>
            Select all shown
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setSelected([])}>
            Clear selection
          </button>
        </div>

        <p role="status" className="mb-3 text-sm">
          <strong>{selected.length}</strong> selected · {mcqCount} multiple choice · {writtenCount} written · {codeCount} coding ·{" "}
          <strong>{totalPoints}</strong> points
        </p>
        {chosenSkills.length > 0 && (
          <p className="mb-3 flex flex-wrap gap-1.5 text-sm">
            {chosenSkills.map((row) => (
              <span key={row.skill} className="badge badge-info">
                {row.skill}: {row.count}
              </span>
            ))}
          </p>
        )}

        {questions.length === 0 ? (
          <p className="text-muted">No questions yet. Create or import questions first.</p>
        ) : (
          <ul className="max-h-[420px] divide-y divide-line overflow-y-auto rounded-md border border-line">
            {visible.length === 0 && <li className="px-3 py-4 text-center text-muted">No questions match these filters.</li>}
            {visible.map((question) => (
              <li key={question.id}>
                <label className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-surface-2">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0"
                    checked={selected.includes(question.id)}
                    onChange={(e) => toggle(question.id, e.target.checked)}
                  />
                  <span className="flex-1">
                    <span className="font-medium">{question.title}</span>
                    <span className="block text-[13px] text-muted">
                      {question.skill} · {TYPE_LABEL[question.type]} ·{" "}
                      {question.level === "junior" ? "Junior" : "Fresher"} · {question.points} pt
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : id ? "Save test" : "Create test"}
        </button>
      </div>
    </form>
  );
}
