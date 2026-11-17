import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Filter } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { membersCol, questionsCol, testsCol } from "@/lib/db";
import { toObjectId } from "@/lib/ids";
import { formatDateTime } from "@/lib/format";
import { summarize } from "@/lib/scoring";
import { MEMBER_STATUSES, type MemberDoc, type MemberStatus } from "@/lib/types";
import { Empty, Loading, PageHead, StatusBadge } from "@/components/ui";
import { IntegrityFlags } from "@/components/IntegrityFlags";

export const metadata: Metadata = { title: "Results" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ResultsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHead title="Results" subtitle="Every invited developer and their score. Open a row to review answers and grade code." />
      <Suspense fallback={<Loading />}>
        <ResultsTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ResultsTable({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const testFilter = typeof params.test === "string" ? toObjectId(params.test) : null;
  const statusFilter =
    typeof params.status === "string" && (MEMBER_STATUSES as readonly string[]).includes(params.status)
      ? (params.status as MemberStatus)
      : undefined;

  const userFilter = typeof params.user === "string" ? toObjectId(params.user) : null;

  const filter: Filter<MemberDoc> = {};
  if (testFilter) filter.testId = testFilter;
  if (userFilter) filter.userId = userFilter;
  if (statusFilter) filter.status = statusFilter;

  const [tests, members] = await Promise.all([
    (await testsCol()).find({}, { projection: { title: 1, questionIds: 1 } }).sort({ title: 1 }).toArray(),
    (await membersCol()).find(filter).sort({ submittedAt: -1, createdAt: -1 }).limit(500).toArray(),
  ]);
  const questionIds = Array.from(new Set(members.flatMap((member) => member.questionOrder.map(String))))
    .map((id) => toObjectId(id))
    .filter((id) => id !== null);
  const questions = await (await questionsCol())
    .find({ _id: { $in: questionIds } }, { projection: { type: 1, points: 1 } })
    .toArray();
  const questionById = new Map(questions.map((question) => [String(question._id), question]));
  const testById = new Map(tests.map((test) => [String(test._id), test]));

  return (
    <>
      <form className="mb-4 flex flex-wrap items-end gap-3">
        {userFilter && <input type="hidden" name="user" value={String(userFilter)} />}
        <div className="min-w-[200px]">
          <label className="label mb-1 block" htmlFor="filter-test">
            Test
          </label>
          <select id="filter-test" name="test" defaultValue={testFilter ? String(testFilter) : ""}>
            <option value="">All tests</option>
            {tests.map((test) => (
              <option key={String(test._id)} value={String(test._id)}>
                {test.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1 block" htmlFor="filter-status">
            Status
          </label>
          <select id="filter-status" name="status" defaultValue={statusFilter ?? ""}>
            <option value="">Any status</option>
            <option value="invited">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="submitted">Submitted</option>
          </select>
        </div>
        <button className="btn" type="submit">
          Filter
        </button>
        {userFilter && (
          <Link className="btn" href="/admin/results">
            Show all users
          </Link>
        )}
      </form>

      <div className="table-wrap">
        {members.length === 0 ? (
          <Empty>No results match.</Empty>
        ) : (
          <table>
            <caption className="sr-only">Results</caption>
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Employee ID</th>
                <th scope="col">Test</th>
                <th scope="col">Status</th>
                <th scope="col">Score</th>
                <th scope="col">Integrity</th>
                <th scope="col">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const id = String(member._id);
                const memberQuestions = member.questionOrder
                  .map((questionId) => questionById.get(String(questionId)))
                  .filter((question) => question !== undefined);
                const score = summarize(memberQuestions, member.answers);
                return (
                  <tr key={id}>
                    <td>
                      <Link href={`/admin/results/${id}`} className="font-medium">
                        {member.name}
                      </Link>
                      <span className="block text-[13px] text-muted">{member.role ?? member.email}</span>
                    </td>
                    <td className="font-mono text-sm">{member.employeeId ?? "—"}</td>
                    <td>{testById.get(String(member.testId))?.title ?? "Deleted test"}</td>
                    <td>
                      <StatusBadge status={member.status} />
                    </td>
                    <td>
                      {member.status === "submitted" ? (
                        <>
                          <strong>
                            {score.earned} / {score.max}
                          </strong>{" "}
                          <span className="text-muted">({score.percent}%)</span>
                          {score.pendingCodeGrading && (
                            <span className="badge badge-warning ml-1">Code not graded</span>
                          )}
                          {score.pendingWrittenCount > 0 && (
                            <span className="badge badge-warning ml-1">{score.pendingWrittenCount} written to mark</span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {member.status === "invited" ? <span className="text-muted">—</span> : <IntegrityFlags member={member} />}
                    </td>
                    <td className="text-muted">{formatDateTime(member.submittedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
