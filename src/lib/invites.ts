import "server-only";
import { randomBytes } from "node:crypto";
import type { ObjectId } from "mongodb";
import { resolveTestSettings, type MemberDoc, type OrderMode, type QuestionType, type TestDoc, type UserDoc } from "./types";

export function newToken(bytes = 18): string {
  return randomBytes(bytes).toString("base64url");
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomBytes(4).readUInt32BE(0) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function orderQuestions(questionIds: ObjectId[], mode: OrderMode, typeById: Map<string, QuestionType>): ObjectId[] {
  if (mode === "fixed") return [...questionIds];
  if (mode === "all") return shuffle(questionIds);
  const sections: ObjectId[][] = [];
  let currentType: QuestionType | undefined;
  for (const id of questionIds) {
    const type = typeById.get(String(id));
    if (sections.length === 0 || type !== currentType) {
      sections.push([]);
      currentType = type;
    }
    sections[sections.length - 1].push(id);
  }
  return sections.flatMap((section) => shuffle(section));
}

export function buildMember(
  test: TestDoc & { _id: ObjectId },
  user: UserDoc & { _id: ObjectId },
  now: Date,
  typeById: Map<string, QuestionType>,
): MemberDoc {
  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    employeeId: user.employeeId,
    role: user.role,
    skills: user.skills,
    testId: test._id,
    token: newToken(),
    status: "invited",
    questionOrder: orderQuestions(test.questionIds, resolveTestSettings(test).orderMode, typeById),
    answers: {},
    tabSwitches: 0,
    createdAt: now,
  };
}
