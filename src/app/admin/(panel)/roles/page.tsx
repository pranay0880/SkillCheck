import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import { questionsCol, skillsCol, usersCol } from "@/lib/db";
import { pluralize } from "@/lib/format";
import { Loading, PageHead } from "@/components/ui";
import { RoleForm } from "./RoleForm";
import { AddSkillForm, SkillRow, type SkillRowData } from "./SkillsManager";

export const metadata: Metadata = { title: "Roles & skills" };

export default function RolesPage() {
  return (
    <>
      <PageHead
        title="Roles & skills"
        subtitle="Each role has its own skills. They decide which skills you can pick for an employee and how questions are grouped."
      />
      <Suspense fallback={<Loading />}>
        <Catalog />
      </Suspense>
    </>
  );
}

function countMap(rows: { _id: string; total: number }[]): Map<string, number> {
  return new Map(rows.map((row) => [row._id, row.total]));
}

async function Catalog() {
  await requireAdmin();
  const catalog = await loadCatalog();
  const [skillDocs, questionCounts, userSkillCounts, userRoleCounts] = await Promise.all([
    (await skillsCol()).find({}, { projection: { name: 1 } }).toArray(),
    (await questionsCol()).aggregate<{ _id: string; total: number }>([{ $group: { _id: "$skill", total: { $sum: 1 } } }]).toArray(),
    (await usersCol())
      .aggregate<{ _id: string; total: number }>([{ $unwind: "$skills" }, { $group: { _id: "$skills", total: { $sum: 1 } } }])
      .toArray(),
    (await usersCol()).aggregate<{ _id: string; total: number }>([{ $group: { _id: "$role", total: { $sum: 1 } } }]).toArray(),
  ]);
  const questionsBySkill = countMap(questionCounts);
  const usersBySkill = countMap(userSkillCounts);
  const usersByRole = countMap(userRoleCounts);
  const idBySkill = new Map(skillDocs.map((doc) => [doc.name, String(doc._id)]));

  const skillRows: SkillRowData[] = catalog.skills.map((name) => ({
    id: idBySkill.get(name) ?? name,
    name,
    roles: catalog.roles.filter((role) => role.skills.includes(name)).map((role) => role.name),
    questions: questionsBySkill.get(name) ?? 0,
    users: usersBySkill.get(name) ?? 0,
  }));

  return (
    <>
      <section aria-labelledby="roles-title" className="mb-8">
        <h2 id="roles-title" className="mb-3">
          Roles <span className="text-base font-normal text-muted">· {catalog.roles.length}</span>
        </h2>
        <details className="card mb-3">
          <summary className="cursor-pointer font-semibold">Add a role</summary>
          <div className="mt-4">
            <RoleForm allSkills={catalog.skills} />
          </div>
        </details>
        {catalog.roles.map((role) => (
          <details key={role.id} className="group mb-3 overflow-hidden rounded-xl border border-line bg-surface">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
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
              <h3 className="m-0 text-base font-semibold">{role.name}</h3>
              <span className="badge">{pluralize(role.skills.length, "skill")}</span>
              <span className="badge">{pluralize(usersByRole.get(role.name) ?? 0, "user")}</span>
              <span className="ml-auto hidden max-w-[50%] truncate text-[13px] text-muted md:inline">{role.skills.join(", ")}</span>
            </summary>
            <div className="border-t border-line p-4">
              <RoleForm key={`${role.id}:${role.name}:${role.skills.join("|")}`} role={role} allSkills={catalog.skills} />
            </div>
          </details>
        ))}
      </section>

      <section aria-labelledby="skills-title">
        <h2 id="skills-title" className="mb-1">
          Skills <span className="text-base font-normal text-muted">· {skillRows.length}</span>
        </h2>
        <p className="mb-3 text-sm text-muted">
          Renaming a skill updates its questions, roles and users. A skill can only be deleted once no question or user uses it.
        </p>
        <AddSkillForm />
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Skills</caption>
            <thead>
              <tr>
                <th scope="col">Skill</th>
                <th scope="col">Roles</th>
                <th scope="col">Questions</th>
                <th scope="col">Users</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {skillRows.map((skill) => (
                <SkillRow key={`${skill.id}:${skill.name}`} skill={skill} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
