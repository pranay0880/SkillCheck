import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { formatDateTime, formatDuration } from "@/lib/format";
import { loadResults, parseResultsFilter } from "@/lib/results";
import { MEMBER_STATUS_LABEL } from "@/lib/types";

const HEADER = [
  "Name",
  "Employee ID",
  "Role",
  "Email",
  "Test",
  "Status",
  "Score",
  "Max marks",
  "Percent",
  "Code to grade",
  "Written answers to mark",
  "Time taken",
  "Tab switches",
  "Fullscreen exits",
  "Blocked second device",
  "Fullscreen supported",
  "Invited",
  "Started",
  "Submitted",
  "Examiner comment",
];

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return new Response("Not signed in", { status: 401 });

  const filter = parseResultsFilter(Object.fromEntries(request.nextUrl.searchParams));
  const { rows } = await loadResults(filter);

  const csv = toCsv(
    HEADER,
    rows.map(({ member, testTitle, score }) => {
      const submitted = member.status === "submitted";
      const started = member.status !== "invited";
      return [
        member.name,
        member.employeeId,
        member.role,
        member.email,
        testTitle,
        MEMBER_STATUS_LABEL[member.status],
        submitted ? score.earned : null,
        score.max,
        submitted ? `${score.percent}%` : null,
        submitted ? (score.pendingCodeGrading ? "Yes" : "No") : null,
        submitted ? score.pendingWrittenCount : null,
        submitted ? formatDuration(member.startedAt, member.submittedAt) : null,
        started ? (member.tabSwitches ?? 0) : null,
        started ? (member.fullscreenExits ?? 0) : null,
        started ? (member.deviceConflicts ?? 0) : null,
        started ? (member.fullscreenUnsupported ? "No" : "Yes") : null,
        formatDateTime(member.createdAt),
        formatDateTime(member.startedAt),
        formatDateTime(member.submittedAt),
        member.overallComment,
      ];
    }),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="skillcheck-results-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
