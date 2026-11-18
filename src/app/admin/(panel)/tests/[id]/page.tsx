import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { resultsCol, testsCol, usersCol } from "@/lib/db";
import { toObjectId } from "@/lib/ids";
import { loadPickableQuestions } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";
import { isEmailConfigured } from "@/lib/email";
import { ActionButton } from "@/components/ActionButton";
import { Empty, Loading, PageHead, StatusBadge } from "@/components/ui";
import { resolveTestSettings, type TestLink, type UserDoc } from "@/lib/types";
import { deleteTest } from "../../../actions";
import { TestForm } from "../TestForm";
import { TestLinksCard, type LinkView, type PickUser } from "./TestLinksCard";

export const metadata: Metadata = { title: "Test" };

function deleteConfirmText(title: string, attempts: number, submitted: number): string {
  if (attempts === 0) return `Delete the test "${title}"? Its links will stop working. This cannot be undone.`;
  const submittedNote = submitted > 0 ? `, including ${submitted} submitted result${submitted === 1 ? "" : "s"} with answers and scores` : "";
  return `Delete the test "${title}" and its ${attempts} attempt${attempts === 1 ? "" : "s"}${submittedNote}?\n\nIts links will stop working. This cannot be undone.`;
}

function inAudience(link: TestLink, user: Pick<UserDoc, "_id" | "role">): boolean {
  if (link.audience === "roles") return link.roles.includes(user.role);
  if (link.audience === "users") return link.userIds.some((id) => String(id) === String(user._id));
  return true;
}

export default function TestDetailPage({ params }: PageProps<"/admin/tests/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <TestDetail params={params} />
    </Suspense>
  );
}

async function TestDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const objectId = toObjectId(id);
  const test = objectId ? await (await testsCol()).findOne({ _id: objectId }) : null;
  if (!test || !objectId) notFound();

  const [questions, members, users] = await Promise.all([
    loadPickableQuestions(),
    (await resultsCol())
      .find(
        { testId: objectId },
        { projection: { userId: 1, name: 1, email: 1, employeeId: 1, role: 1, status: 1, createdAt: 1, startedAt: 1, submittedAt: 1 } },
      )
      .sort({ createdAt: -1 })
      .toArray(),
    (await usersCol()).find({}, { projection: { name: 1, employeeId: 1, role: 1 } }).sort({ name: 1 }).toArray(),
  ]);

  const submittedUserIds = new Set(members.filter((member) => member.status === "submitted").map((member) => String(member.userId)));
  const userById = new Map(users.map((user) => [String(user._id), user]));
  const links: LinkView[] = (test.links ?? []).map((link) => {
    const eligible = users.filter((user) => inAudience(link, user));
    return {
      code: link.code,
      label: link.label,
      audience: link.audience,
      roles: link.roles,
      userNames: link.userIds.map((userId) => userById.get(String(userId))?.name ?? "Deleted user"),
      enabled: link.enabled,
      eligibleCount: eligible.length,
      pendingCount: eligible.filter((user) => !submittedUserIds.has(String(user._id))).length,
      lastEmailedAt: link.lastEmailedAt ? link.lastEmailedAt.toISOString() : null,
      lastEmailedCount: link.lastEmailedCount ?? 0,
    };
  });
  const pickUsers: PickUser[] = users.map((user) => ({ id: String(user._id), name: user.name, employeeId: user.employeeId, role: user.role }));
  const roles = Array.from(new Set(users.map((user) => user.role))).sort();
  const submittedCount = members.filter((member) => member.status === "submitted").length;

  return (
    <>
      <PageHead
        title={test.title}
        subtitle={`${test.questionIds.length} questions · ${test.durationMinutes} minutes`}
        actions={
          <>
            <Link className="btn btn-primary" href={`/admin/tests/${id}/preview`}>
              Preview test
            </Link>
            <ActionButton
              action={deleteTest.bind(null, id, members.length)}
              label="Delete test"
              pendingLabel="Deleting…"
              confirmText={deleteConfirmText(test.title, members.length, submittedCount)}
              className="btn btn-danger"
            />
          </>
        }
      />

      <TestLinksCard testId={id} links={links} users={pickUsers} roles={roles} emailReady={isEmailConfigured()} />

      <div className="card">
        <h2 className="mb-1">Attempts</h2>
        <p className="mb-3 text-sm text-muted">Employees appear here once they verify through a link.</p>
        {members.length === 0 ? (
          <Empty>No attempts yet.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Attempts</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Employee ID</th>
                  <th scope="col">Status</th>
                  <th scope="col">Verified</th>
                  <th scope="col">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={String(member._id)}>
                    <td>
                      <Link href={`/admin/results/${String(member._id)}`} className="font-medium">
                        {member.name}
                      </Link>
                      <span className="block text-[13px] text-muted">{member.role ?? member.email}</span>
                    </td>
                    <td className="font-mono text-sm">{member.employeeId ?? "—"}</td>
                    <td>
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="text-muted">{formatDateTime(member.createdAt)}</td>
                    <td className="text-muted">{formatDateTime(member.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 className="mb-3 mt-8">Edit test</h2>
      <TestForm
        id={id}
        questions={questions}
        initial={{
          title: test.title,
          description: test.description,
          durationMinutes: test.durationMinutes,
          ...resolveTestSettings(test),
          questionIds: test.questionIds.map(String),
        }}
      />
    </>
  );
}
