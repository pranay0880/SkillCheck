import "server-only";
import type { Filter, WithId } from "mongodb";
import { resultsCol, questionsCol, testsCol } from "./db";
import { toObjectId } from "./ids";
import { summarize, type ScoreSummary } from "./scoring";
import { MEMBER_STATUSES, type MemberDoc, type MemberStatus, type TestDoc } from "./types";

export const RESULTS_LIMIT = 500;

type RawParams = Record<string, string | string[] | undefined>;

export interface ResultsFilter {
  testId: string | null;
  userId: string | null;
  status: MemberStatus | undefined;
}

export interface ResultRow {
  member: WithId<MemberDoc>;
  testTitle: string;
  score: ScoreSummary;
}

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function parseResultsFilter(params: RawParams): ResultsFilter {
  const testId = toObjectId(single(params.test) ?? "");
  const userId = toObjectId(single(params.user) ?? "");
  const status = single(params.status);
  return {
    testId: testId ? String(testId) : null,
    userId: userId ? String(userId) : null,
    status: status && (MEMBER_STATUSES as readonly string[]).includes(status) ? (status as MemberStatus) : undefined,
  };
}

export function resultsQueryString(filter: ResultsFilter): string {
  const query = new URLSearchParams();
  if (filter.testId) query.set("test", filter.testId);
  if (filter.userId) query.set("user", filter.userId);
  if (filter.status) query.set("status", filter.status);
  const text = query.toString();
  return text ? `?${text}` : "";
}

export async function loadResults(
  filter: ResultsFilter,
): Promise<{ tests: WithId<Pick<TestDoc, "title">>[]; rows: ResultRow[] }> {
  const query: Filter<MemberDoc> = {};
  const testId = filter.testId ? toObjectId(filter.testId) : null;
  const userId = filter.userId ? toObjectId(filter.userId) : null;
  if (testId) query.testId = testId;
  if (userId) query.userId = userId;
  if (filter.status) query.status = filter.status;

  const [tests, members] = await Promise.all([
    (await testsCol()).find({}, { projection: { title: 1 } }).sort({ title: 1 }).toArray(),
    (await resultsCol()).find(query).sort({ submittedAt: -1, createdAt: -1 }).limit(RESULTS_LIMIT).toArray(),
  ]);
  const questionIds = Array.from(new Set(members.flatMap((member) => member.questionOrder.map(String))))
    .map((id) => toObjectId(id))
    .filter((id) => id !== null);
  const questions = await (await questionsCol())
    .find({ _id: { $in: questionIds } }, { projection: { type: 1, points: 1 } })
    .toArray();
  const questionById = new Map(questions.map((question) => [String(question._id), question]));
  const titleById = new Map(tests.map((test) => [String(test._id), test.title]));

  const rows = members.map((member) => {
    const memberQuestions = member.questionOrder
      .map((questionId) => questionById.get(String(questionId)))
      .filter((question) => question !== undefined);
    return {
      member,
      testTitle: titleById.get(String(member.testId)) ?? "Deleted test",
      score: summarize(memberQuestions, member.answers),
    };
  });
  return { tests, rows };
}
