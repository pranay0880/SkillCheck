import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Filter } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { resultsCol, testsCol } from "@/lib/db";
import { toObjectId } from "@/lib/ids";
import { formatDateTime } from "@/lib/format";
import {
  FEEDBACK_DIFFICULTY_LABEL,
  FEEDBACK_RATING_LABEL,
  FEEDBACK_TIMING_LABEL,
  type MemberDoc,
} from "@/lib/types";
import { Empty, Loading, PageHead, Stat } from "@/components/ui";

export const metadata: Metadata = { title: "Feedback" };

const FEEDBACK_LIMIT = 500;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function FeedbackPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHead title="Feedback" subtitle="What employees said about each test after submitting it." />
      <Suspense fallback={<Loading />}>
        <FeedbackTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function share(count: number, total: number): string {
  return total === 0 ? "—" : `${Math.round((count / total) * 100)}%`;
}

async function FeedbackTable({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const testParam = typeof params.test === "string" ? params.test : "";
  const testId = toObjectId(testParam);

  const query: Filter<MemberDoc> = { feedback: { $exists: true } };
  if (testId) query.testId = testId;

  const [tests, entries] = await Promise.all([
    (await testsCol()).find({}, { projection: { title: 1 } }).sort({ title: 1 }).toArray(),
    (await resultsCol())
      .find(query, { projection: { name: 1, employeeId: 1, role: 1, email: 1, testId: 1, feedback: 1 } })
      .sort({ "feedback.submittedAt": -1 })
      .limit(FEEDBACK_LIMIT)
      .toArray(),
  ]);
  const titleById = new Map(tests.map((test) => [String(test._id), test.title]));
  const rows = entries.filter((entry) => entry.feedback !== undefined);
  const total = rows.length;
  const averageRating = total === 0 ? null : rows.reduce((sum, entry) => sum + (entry.feedback?.rating ?? 0), 0) / total;
  const tooHard = rows.filter((entry) => entry.feedback?.difficulty === "too_hard").length;
  const notEnoughTime = rows.filter((entry) => entry.feedback?.timing === "not_enough").length;

  return (
    <>
      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px]">
          <label className="label mb-1 block" htmlFor="filter-test">
            Test
          </label>
          <select id="filter-test" name="test" defaultValue={testId ? String(testId) : ""}>
            <option value="">All tests</option>
            {tests.map((test) => (
              <option key={String(test._id)} value={String(test._id)}>
                {test.title}
              </option>
            ))}
          </select>
        </div>
        <button className="btn" type="submit">
          Filter
        </button>
      </form>

      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <Stat label="Responses" value={total} />
        <Stat label="Average rating" value={averageRating === null ? "—" : `${averageRating.toFixed(1)} / 5`} />
        <Stat label="Found it too hard" value={share(tooHard, total)} />
        <Stat label="Not enough time" value={share(notEnoughTime, total)} />
      </div>

      <div className="table-wrap">
        {total === 0 ? (
          <Empty>No feedback yet.</Empty>
        ) : (
          <table>
            <caption className="sr-only">Employee feedback</caption>
            <thead>
              <tr>
                <th scope="col">Employee</th>
                <th scope="col">Test</th>
                <th scope="col">Rating</th>
                <th scope="col">Difficulty</th>
                <th scope="col">Time given</th>
                <th scope="col">Comment</th>
                <th scope="col">Sent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => {
                const id = String(entry._id);
                const feedback = entry.feedback;
                if (!feedback) return null;
                return (
                  <tr key={id}>
                    <td>
                      <Link href={`/admin/results/${id}`} className="font-medium">
                        {entry.name}
                      </Link>
                      <span className="block text-[13px] text-muted">
                        {[entry.employeeId, entry.role].filter(Boolean).join(" · ") || entry.email}
                      </span>
                    </td>
                    <td>{titleById.get(String(entry.testId)) ?? "Deleted test"}</td>
                    <td className="whitespace-nowrap">
                      <strong>{feedback.rating}</strong> / 5
                      <span className="block text-[13px] text-muted">{FEEDBACK_RATING_LABEL[feedback.rating]}</span>
                    </td>
                    <td>
                      <span className={`badge ${feedback.difficulty === "about_right" ? "badge-success" : "badge-warning"}`}>
                        {FEEDBACK_DIFFICULTY_LABEL[feedback.difficulty]}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${feedback.timing === "about_right" ? "badge-success" : "badge-warning"}`}>
                        {FEEDBACK_TIMING_LABEL[feedback.timing]}
                      </span>
                    </td>
                    <td className="max-w-[340px] whitespace-pre-wrap text-sm">
                      {feedback.comment ?? <span className="text-muted">—</span>}
                    </td>
                    <td className="whitespace-nowrap text-muted">{formatDateTime(feedback.submittedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {total === FEEDBACK_LIMIT && (
        <p className="mt-3 text-sm text-muted">Showing the latest {FEEDBACK_LIMIT} responses. Filter by test to narrow the list.</p>
      )}
    </>
  );
}
