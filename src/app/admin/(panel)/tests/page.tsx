import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { membersCol, testsCol } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { Empty, Loading, PageHead } from "@/components/ui";

export const metadata: Metadata = { title: "Tests" };

export default function TestsPage() {
  return (
    <>
      <PageHead
        title="Tests"
        subtitle="A test is a set of questions with a time limit. Open a test to invite developers."
        actions={
          <Link className="btn btn-primary" href="/admin/tests/new">
            New test
          </Link>
        }
      />
      <Suspense fallback={<Loading />}>
        <TestList />
      </Suspense>
    </>
  );
}

async function TestList() {
  await requireAdmin();
  const tests = await (await testsCol()).find().sort({ createdAt: -1 }).toArray();
  const counts = await (await membersCol())
    .aggregate<{ _id: unknown; invited: number; submitted: number }>([
      {
        $group: {
          _id: "$testId",
          invited: { $sum: 1 },
          submitted: { $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] } },
        },
      },
    ])
    .toArray();
  const countById = new Map(counts.map((count) => [String(count._id), count]));

  if (tests.length === 0) {
    return (
      <div className="table-wrap">
        <Empty>No tests yet. Create one to start inviting developers.</Empty>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <caption className="sr-only">Tests</caption>
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Questions</th>
            <th scope="col">Time limit</th>
            <th scope="col">Invited</th>
            <th scope="col">Submitted</th>
            <th scope="col">Created</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => {
            const id = String(test._id);
            const count = countById.get(id);
            return (
              <tr key={id}>
                <td>
                  <Link href={`/admin/tests/${id}`} className="font-medium">
                    {test.title}
                  </Link>
                </td>
                <td>{test.questionIds.length}</td>
                <td>{test.durationMinutes} min</td>
                <td>{count?.invited ?? 0}</td>
                <td>{count?.submitted ?? 0}</td>
                <td className="text-muted">{formatDateTime(test.createdAt)}</td>
                <td className="text-right">
                  <Link className="btn btn-sm" href={`/admin/tests/${id}/preview`} aria-label={`Preview ${test.title}`}>
                    Preview
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
