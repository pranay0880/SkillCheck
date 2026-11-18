import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { loadResults, parseResultsFilter, resultsQueryString, RESULTS_LIMIT } from "@/lib/results";
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
  const filter = parseResultsFilter(await searchParams);
  const { tests, rows } = await loadResults(filter);
  const exportHref = `/admin/results/export${resultsQueryString(filter)}`;

  return (
    <>
      <form className="mb-4 flex flex-wrap items-end gap-3">
        {filter.userId && <input type="hidden" name="user" value={filter.userId} />}
        <div className="min-w-[200px]">
          <label className="label mb-1 block" htmlFor="filter-test">
            Test
          </label>
          <select id="filter-test" name="test" defaultValue={filter.testId ?? ""}>
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
          <select id="filter-status" name="status" defaultValue={filter.status ?? ""}>
            <option value="">Any status</option>
            <option value="invited">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="submitted">Submitted</option>
          </select>
        </div>
        <button className="btn" type="submit">
          Filter
        </button>
        {filter.userId && (
          <Link className="btn" href="/admin/results">
            Show all users
          </Link>
        )}
        {rows.length > 0 && (
          <a className="btn ml-auto no-underline" href={exportHref} download>
            Download CSV ({rows.length})
          </a>
        )}
      </form>

      <div className="table-wrap">
        {rows.length === 0 ? (
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
              {rows.map(({ member, testTitle, score }) => {
                const id = String(member._id);
                return (
                  <tr key={id}>
                    <td>
                      <Link href={`/admin/results/${id}`} className="font-medium">
                        {member.name}
                      </Link>
                      <span className="block text-[13px] text-muted">{member.role ?? member.email}</span>
                    </td>
                    <td className="font-mono text-sm">{member.employeeId ?? "—"}</td>
                    <td>{testTitle}</td>
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
      {rows.length === RESULTS_LIMIT && (
        <p className="mt-3 text-sm text-muted">Showing the latest {RESULTS_LIMIT} results. Filter by test to narrow the list.</p>
      )}
    </>
  );
}
