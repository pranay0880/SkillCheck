import "server-only";
import { createHash } from "node:crypto";
import { connection } from "next/server";
import { resultsCol, questionsCol, testsCol } from "./db";
import { deadlineFor, scoreMcq, SUBMIT_GRACE_MS } from "./scoring";
import type { MemberDoc, PublicQuestion, QuestionDoc, TestDoc } from "./types";

const TOKEN_PATTERN = /^[\w-]{20,40}$/;

export interface CandidateContext {
  member: MemberDoc;
  test: TestDoc;
}

export async function loadCandidate(token: string): Promise<CandidateContext | null> {
  await connection();
  if (!TOKEN_PATTERN.test(token)) return null;
  const member = await (await resultsCol()).findOne({ token });
  if (!member) return null;
  const test = await (await testsCol()).findOne({ _id: member.testId });
  if (!test) return null;
  if (isExpired(member, test)) {
    const finalized = await finalizeAttempt(member);
    return { member: finalized, test };
  }
  return { member, test };
}

export function isExpired(member: MemberDoc, test: TestDoc): boolean {
  if (member.status !== "in_progress" || !member.startedAt) return false;
  return Date.now() > deadlineFor(member.startedAt, test.durationMinutes).getTime() + SUBMIT_GRACE_MS;
}

export async function loadOrderedQuestions(member: MemberDoc): Promise<QuestionDoc[]> {
  const questions = await (await questionsCol()).find({ _id: { $in: member.questionOrder } }).toArray();
  const byId = new Map(questions.map((question) => [String(question._id), question]));
  return member.questionOrder.map((id) => byId.get(String(id))).filter((question) => question !== undefined);
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const roll = createHash("sha256").update(`${seed}:${i}`).digest().readUInt32BE(0);
    const j = roll % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function toPublicQuestion(question: QuestionDoc, optionSeed?: string): PublicQuestion {
  const id = String(question._id);
  if (question.type === "mcq") {
    return {
      id,
      type: "mcq",
      title: question.title,
      prompt: question.prompt,
      points: question.points,
      multiple: question.correctOptionIds.length > 1,
      options: optionSeed ? seededShuffle(question.options, `${optionSeed}:${id}`) : question.options,
    };
  }
  if (question.type === "text") {
    return { id, type: "text", title: question.title, prompt: question.prompt, points: question.points };
  }
  return {
    id,
    type: "code",
    title: question.title,
    prompt: question.prompt,
    points: question.points,
    functionName: question.functionName,
    starterCode: question.starterCode,
    sampleCases: question.testCases.filter((testCase) => !testCase.hidden),
  };
}

export async function finalizeAttempt(member: MemberDoc): Promise<MemberDoc> {
  if (member.status !== "in_progress") return member;
  const questions = await loadOrderedQuestions(member);
  const set: Record<string, unknown> = { status: "submitted", submittedAt: new Date() };
  for (const question of questions) {
    const key = String(question._id);
    const answer = member.answers[key];
    if (question.type === "mcq") {
      set[`answers.${key}.autoScore`] = scoreMcq(question.correctOptionIds, answer?.selectedOptionIds, question.points);
      if (!answer) set[`answers.${key}.savedAt`] = new Date();
    } else if (question.type === "text" && !answer?.text?.trim()) {
      set[`answers.${key}.autoScore`] = 0;
      if (!answer) set[`answers.${key}.savedAt`] = new Date();
    }
  }
  const updated = await (await resultsCol()).findOneAndUpdate(
    { _id: member._id, status: "in_progress" },
    { $set: set },
    { returnDocument: "after" },
  );
  return updated ?? ((await (await resultsCol()).findOne({ _id: member._id })) as MemberDoc);
}
