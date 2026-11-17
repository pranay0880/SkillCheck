import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { membersCol, questionsCol, testsCol, usersCol } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { Empty, Loading, PageHead, Stat, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHead title="Dashboard" subtitle="Overview of your question bank, tests and recent attempts." />
      <Suspense fallback={<Loading />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  await requireAdmin();
  const [questions, tests, members, users] = await Promise.all([questionsCol(), testsCol(), membersCol(), usersCol()]);
  const [userCount, questionCount, testCount, invited, inProgress, submitted, recent] = await Promise.all([
    users.countDocuments(),
    questions.countDocuments(),
    tests.countDocuments(),
    members.countDocuments({ status: "invited" }),
    members.countDocuments({ status: "in_progress" }),
    members.countDocuments({ status: "submitted" }),
    members.find({}, { projection: { name: 1, status: 1, createdAt: 1, submittedAt: 1 } }).sort({ createdAt: -1 }).limit(8).toArray(),
  ]);

  return (
    <>
      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <Stat label="Users" value={userCount} />
        <Stat label="Questions" value={questionCount} />
        <Stat label="Tests" value={testCount} />
        <Stat label="Not started" value={invited} />
        <Stat label="In progress" value={inProgress} />
        <Stat label="Submitted" value={submitted} />
      </div>

      {questionCount === 0 && (
        <div className="alert alert-info">
          Start by importing the starter question bank on the <Link href="/admin/questions">Questions</Link> page, then
          create a test and invite a developer.
        </div>
      )}

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2>Recent invites</h2>
          <Link href="/admin/results" className="text-sm">
            View all results
          </Link>
        </div>
        {recent.length === 0 ? (
          <Empty>No invites yet.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((member) => (
              <li key={String(member._id)} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <Link href={`/admin/results/${String(member._id)}`} className="font-medium">
                  {member.name}
                </Link>
                <span className="flex items-center gap-3 text-sm text-muted">
                  {formatDateTime(member.submittedAt ?? member.createdAt)}
                  <StatusBadge status={member.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
