import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Filter } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { questionsCol } from "@/lib/db";
import { LEVELS, QUESTION_TYPES, type QuestionDoc, type QuestionType } from "@/lib/types";
import { sortSkills } from "@/data/skills";
import { loadCatalog } from "@/lib/catalog";
import { ActionButton } from "@/components/ActionButton";
import { Empty, LevelBadge, Loading, PageHead, TYPE_LABEL, TypeBadge } from "@/components/ui";
import { AccordionControls } from "@/components/AccordionControls";
import { deleteQuestion, importQuestionBank } from "../../actions";

export const metadata: Metadata = { title: "Questions" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function typeBreakdown(items: { type: QuestionType }[]): string {
  const order: QuestionType[] = ["mcq", "text", "code"];
  return order
    .map((value) => ({ value, count: items.filter((item) => item.type === value).length }))
    .filter((row) => row.count > 0)
    .map((row) => `${row.count} ${TYPE_LABEL[row.value].toLowerCase()}`)
    .join(" · ");
}

function filterHref(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  const text = query.toString();
  return text ? `/admin/questions?${text}` : "/admin/questions";
}

export default function QuestionsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHead
        title="Questions"
        subtitle="Your question bank, grouped by skill. Pick a role to see only its skills. Questions are reused across tests."
        actions={
          <>
            <ActionButton action={importQuestionBank} label="Import question bank" pendingLabel="Importing…" className="btn" />
            <Link className="btn btn-primary" href="/admin/questions/new">
              New question
            </Link>
          </>
        }
      />
      <Suspense fallback={<Loading />}>
        <QuestionList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function QuestionList({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const catalog = await loadCatalog();
  const role = catalog.roles.find((item) => item.id === params.role);
  const level = pick(params.level, LEVELS);
  const type = pick(params.type, QUESTION_TYPES);
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";

  const col = await questionsCol();
  const counts = await col
    .aggregate<{ _id: string; total: number }>([{ $group: { _id: "$skill", total: { $sum: 1 } } }])
    .toArray();
  const countBySkill = new Map(counts.map((row) => [row._id, row.total]));
  const allSkills = sortSkills([...catalog.skills, ...counts.map((row) => row._id)]);
  const shownSkills = role ? role.skills : allSkills;
  const skill = pick(params.skill, shownSkills);
  const totalCount = shownSkills.reduce((sum, name) => sum + (countBySkill.get(name) ?? 0), 0);

  const filter: Filter<QuestionDoc> = {};
  if (skill) filter.skill = skill;
  else if (role) filter.skill = { $in: role.skills };
  if (level) filter.level = level;
  if (type) filter.type = type;
  if (search) filter.title = new RegExp(escapeRegex(search), "i");

  const questions = await col
    .find(filter, { projection: { title: 1, type: 1, level: 1, skill: 1, points: 1 } })
    .sort({ level: 1, type: 1, title: 1 })
    .toArray();

  const groups = shownSkills.map((name) => ({ name, items: questions.filter((question) => question.skill === name) })).filter(
    (group) => group.items.length > 0,
  );

  const keep = { role: role?.id, level, type, q: search || undefined };
  const autoOpen = Boolean(skill || search || level || type);

  return (
    <>
      <nav aria-label="Filter by skill" className="mb-4 flex flex-wrap gap-1.5">
        <Link
          href={filterHref(keep)}
          aria-current={!skill ? "page" : undefined}
          className="badge no-underline aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-on-primary"
        >
          {role ? `All ${role.name} skills` : "All skills"} · {totalCount}
        </Link>
        {shownSkills.map((name) => (
          <Link
            key={name}
            href={filterHref({ ...keep, skill: name })}
            aria-current={skill === name ? "page" : undefined}
            className="badge no-underline aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-on-primary"
          >
            {name} · {countBySkill.get(name) ?? 0}
          </Link>
        ))}
      </nav>

      <form className="mb-5 flex flex-wrap items-end gap-3" role="search">
        {skill && <input type="hidden" name="skill" value={skill} />}
        <div>
          <label className="label mb-1 block" htmlFor="role">
            Role
          </label>
          <select id="role" name="role" defaultValue={role?.id ?? ""}>
            <option value="">All roles</option>
            {catalog.roles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="label mb-1 block" htmlFor="q">
            Search titles
          </label>
          <input id="q" name="q" type="search" defaultValue={search} placeholder="e.g. useEffect" />
        </div>
        <div>
          <label className="label mb-1 block" htmlFor="level">
            Level
          </label>
          <select id="level" name="level" defaultValue={level ?? ""}>
            <option value="">All levels</option>
            <option value="fresher">Fresher</option>
            <option value="junior">Junior</option>
          </select>
        </div>
        <div>
          <label className="label mb-1 block" htmlFor="type">
            Type
          </label>
          <select id="type" name="type" defaultValue={type ?? ""}>
            <option value="">All types</option>
            <option value="mcq">Multiple choice</option>
            <option value="text">Written</option>
            <option value="code">Coding</option>
          </select>
        </div>
        <button className="btn" type="submit">
          Filter
        </button>
      </form>

      {groups.length === 0 ? (
        <div className="table-wrap">
          <Empty>
            {totalCount === 0
              ? "No questions yet. Click “Import question bank” to load the skill-based questions, or create one."
              : "No questions match these filters."}
          </Empty>
        </div>
      ) : (
        <div id="skill-accordion">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-sm text-muted">
            {groups.length} skill{groups.length === 1 ? "" : "s"} · click a skill to show its questions
          </p>
          <AccordionControls containerId="skill-accordion" />
        </div>
        {groups.map((group) => (
          <details
            key={group.name}
            open={autoOpen}
            className="group mb-3 overflow-hidden rounded-xl border border-line bg-surface"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-muted transition-transform group-open:rotate-90"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
              <h2 className="m-0 text-base font-semibold">{group.name}</h2>
              <span className="badge">{group.items.length}</span>
              <span className="ml-auto hidden text-[13px] text-muted sm:inline">{typeBreakdown(group.items)}</span>
            </summary>
            <div className="table-wrap rounded-none border-x-0 border-b-0">
              <table>
                <caption className="sr-only">{group.name} questions</caption>
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Type</th>
                    <th scope="col">Level</th>
                    <th scope="col">Points</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((question) => {
                    const id = String(question._id);
                    return (
                      <tr key={id}>
                        <td>
                          <Link href={`/admin/questions/${id}`} className="font-medium">
                            {question.title}
                          </Link>
                        </td>
                        <td>
                          <TypeBadge type={question.type} />
                        </td>
                        <td>
                          <LevelBadge level={question.level} />
                        </td>
                        <td>{question.points}</td>
                        <td className="text-right">
                          <ActionButton
                            action={deleteQuestion.bind(null, id)}
                            label="Delete"
                            pendingLabel="Deleting…"
                            confirmText={`Delete "${question.title}"?`}
                            className="btn btn-sm btn-danger"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        ))}
        </div>
      )}
      <p className="hint mt-2">{questions.length} shown</p>
    </>
  );
}
