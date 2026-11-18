import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import { resultsCol, testsCol, usersCol } from "@/lib/db";
import { toObjectId } from "@/lib/ids";
import { formatDateTime } from "@/lib/format";
import { Loading, PageHead, StatusBadge } from "@/components/ui";
import { UserForm } from "../UserForm";

export const metadata: Metadata = { title: "Edit user" };

export default function EditUserPage({ params }: PageProps<"/admin/users/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const objectId = toObjectId(id);
  const user = objectId ? await (await usersCol()).findOne({ _id: objectId }) : null;
  if (!user || !objectId) notFound();

  const attempts = await (await resultsCol())
    .find({ userId: objectId }, { projection: { testId: 1, status: 1, createdAt: 1, submittedAt: 1 } })
    .sort({ createdAt: -1 })
    .toArray();
  const tests = await (await testsCol())
    .find({ _id: { $in: attempts.map((attempt) => attempt.testId) } }, { projection: { title: 1 } })
    .toArray();
  const titleById = new Map(tests.map((test) => [String(test._id), test.title]));
  const { roles } = await loadCatalog();

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/users">← All users</Link>
      </p>
      <PageHead title={user.name} subtitle={`${user.employeeId} · ${user.role}`} />
      <UserForm
        roles={roles}
        id={id}
        initial={{ name: user.name, employeeId: user.employeeId, role: user.role, email: user.email, skills: user.skills }}
      />

      <div className="card max-w-3xl">
        <h2 className="mb-3">Test history</h2>
        {attempts.length === 0 ? (
          <p className="text-muted">Not invited to any tests yet. Open a test to invite this user.</p>
        ) : (
          <ul className="divide-y divide-line">
            {attempts.map((attempt) => (
              <li key={String(attempt._id)} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <Link href={`/admin/results/${String(attempt._id)}`} className="font-medium">
                  {titleById.get(String(attempt.testId)) ?? "Deleted test"}
                </Link>
                <span className="flex items-center gap-3 text-sm text-muted">
                  {formatDateTime(attempt.submittedAt ?? attempt.createdAt)}
                  <StatusBadge status={attempt.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
