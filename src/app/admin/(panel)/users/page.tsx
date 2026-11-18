import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Filter } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { resultsCol, usersCol } from "@/lib/db";
import type { UserDoc } from "@/lib/types";
import { ActionButton } from "@/components/ActionButton";
import { Empty, Loading, PageHead } from "@/components/ui";
import { deleteUser } from "../../actions";

export const metadata: Metadata = { title: "Users" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const VISIBLE_SKILLS = 5;

function SkillBadges({ skills }: { skills: string[] }) {
  const shown = skills.slice(0, VISIBLE_SKILLS);
  const hidden = skills.slice(VISIBLE_SKILLS);
  return (
    <span className="flex max-w-xs flex-wrap gap-1">
      {shown.map((value) => (
        <span key={value} className="badge badge-info">
          {value}
        </span>
      ))}
      {hidden.length > 0 && (
        <span className="badge cursor-help" title={hidden.join(", ")}>
          <span aria-hidden="true">+{hidden.length} more…</span>
          <span className="sr-only">and {hidden.length} more: {hidden.join(", ")}</span>
        </span>
      )}
    </span>
  );
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHead
        title="Users"
        subtitle="Employees you can invite to tests."
        actions={
          <Link className="btn btn-primary" href="/admin/users/new">
            Add user
          </Link>
        }
      />
      <Suspense fallback={<Loading />}>
        <UserList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function UserList({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const role = typeof params.role === "string" ? params.role.slice(0, 60) : "";
  const skill = typeof params.skill === "string" ? params.skill.slice(0, 40) : "";

  const users = await usersCol();
  const [roles, skills] = await Promise.all([users.distinct("role"), users.distinct("skills")]);

  const filter: Filter<UserDoc> = {};
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: pattern }, { employeeId: pattern }, { email: pattern }];
  }
  if (role) filter.role = role;
  if (skill) filter.skills = skill;

  const list = await users.find(filter).sort({ name: 1 }).toArray();
  const attemptCounts = await (await resultsCol())
    .aggregate<{ _id: unknown; total: number }>([
      { $match: { userId: { $in: list.map((user) => user._id) } } },
      { $group: { _id: "$userId", total: { $sum: 1 } } },
    ])
    .toArray();
  const attemptsById = new Map(attemptCounts.map((count) => [String(count._id), count.total]));

  return (
    <>
      <form className="mb-4 flex flex-wrap items-end gap-3" role="search">
        <div className="min-w-[220px] flex-1">
          <label className="label mb-1 block" htmlFor="users-q">
            Search
          </label>
          <input id="users-q" name="q" type="search" defaultValue={search} placeholder="Name, employee ID or email" />
        </div>
        <div>
          <label className="label mb-1 block" htmlFor="users-role">
            Role
          </label>
          <select id="users-role" name="role" defaultValue={role}>
            <option value="">All roles</option>
            {roles.sort().map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1 block" htmlFor="users-skill">
            Skill
          </label>
          <select id="users-skill" name="skill" defaultValue={skill}>
            <option value="">Any skill</option>
            {skills.sort().map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <button className="btn" type="submit">
          Filter
        </button>
      </form>

      <div className="table-wrap">
        {list.length === 0 ? (
          <Empty>{search || role || skill ? "No users match." : "No users yet. Add your first user."}</Empty>
        ) : (
          <table>
            <caption className="sr-only">Users</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Employee ID</th>
                <th scope="col">Role</th>
                <th scope="col">Skills</th>
                <th scope="col">Tests</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((user) => {
                const id = String(user._id);
                const attempts = attemptsById.get(id) ?? 0;
                return (
                  <tr key={id}>
                    <td>
                      <Link href={`/admin/users/${id}`} className="font-medium">
                        {user.name}
                      </Link>
                      <span className="block text-[13px] text-muted">{user.email}</span>
                    </td>
                    <td className="font-mono text-sm">{user.employeeId}</td>
                    <td>{user.role}</td>
                    <td>
                      <SkillBadges skills={user.skills} />
                    </td>
                    <td>
                      {attempts > 0 ? <Link href={`/admin/results?user=${id}`}>{attempts}</Link> : <span className="text-muted">0</span>}
                    </td>
                    <td className="text-right">
                      <ActionButton
                        action={deleteUser.bind(null, id)}
                        label="Delete"
                        pendingLabel="Deleting…"
                        confirmText={`Delete ${user.name} (${user.employeeId})?`}
                        className="btn btn-sm btn-danger"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="hint mt-2">{list.length} shown</p>
    </>
  );
}
