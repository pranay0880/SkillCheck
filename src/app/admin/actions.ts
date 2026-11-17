"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { endAdminSession, isCorrectAdminPassword, requireAdmin, startAdminSession } from "@/lib/auth";
import { membersCol, otpsCol, questionsCol, testsCol, usersCol } from "@/lib/db";
import { toObjectId } from "@/lib/ids";
import { newToken } from "@/lib/invites";
import { usersFilterForLink } from "@/lib/audience";
import { inviteEmail, isEmailConfigured, sendBatch } from "@/lib/email";
import { firstIssue, questionSchema, testLinkSchema, testSchema, userSchema } from "@/lib/validation";
import { QUESTION_BANK } from "@/data/question-bank";
import type { ActionResult, QuestionDoc, TestLink } from "@/lib/types";

export async function login(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  if (!password || !isCorrectAdminPassword(password)) {
    return { ok: false, message: "Incorrect password." };
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}

export async function saveQuestion(id: string | null, input: unknown): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const now = new Date();
  const col = await questionsCol();
  if (id) {
    const objectId = toObjectId(id);
    if (!objectId) return { ok: false, message: "Question not found." };
    const existing = await col.findOne({ _id: objectId }, { projection: { createdAt: 1 } });
    if (!existing) return { ok: false, message: "Question not found." };
    await col.replaceOne({ _id: objectId }, { ...parsed.data, createdAt: existing.createdAt, updatedAt: now } as QuestionDoc);
    return { ok: true, id };
  }
  const inserted = await col.insertOne({ ...parsed.data, createdAt: now, updatedAt: now } as QuestionDoc);
  return { ok: true, id: String(inserted.insertedId) };
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  await requireAdmin();
  const objectId = toObjectId(id);
  if (!objectId) return { ok: false, message: "Question not found." };
  const usedBy = await (await testsCol()).countDocuments({ questionIds: objectId });
  if (usedBy > 0) {
    return { ok: false, message: `This question is used in ${usedBy} test(s). Remove it from those tests first.` };
  }
  await (await questionsCol()).deleteOne({ _id: objectId });
  refresh();
  return { ok: true };
}

export async function importQuestionBank(): Promise<ActionResult> {
  await requireAdmin();
  const col = await questionsCol();
  const existing = new Set((await col.find({}, { projection: { title: 1 } }).toArray()).map((q) => q.title));
  const now = new Date();
  const fresh = QUESTION_BANK.filter((q) => !existing.has(q.title)).map(
    (q) => ({ ...q, createdAt: now, updatedAt: now }) as QuestionDoc,
  );
  if (fresh.length > 0) await col.insertMany(fresh);
  refresh();
  return {
    ok: true,
    message: fresh.length ? `Imported ${fresh.length} questions.` : "All question bank questions are already imported.",
  };
}

export async function saveTest(id: string | null, input: unknown): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const parsed = testSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const questionIds = parsed.data.questionIds.map((value) => toObjectId(value)).filter((value) => value !== null);
  const found = await (await questionsCol()).countDocuments({ _id: { $in: questionIds } });
  if (found !== questionIds.length) return { ok: false, message: "Some selected questions no longer exist." };
  const now = new Date();
  const col = await testsCol();
  const doc = { ...parsed.data, shuffleQuestions: parsed.data.orderMode === "all", questionIds, updatedAt: now };
  if (id) {
    const objectId = toObjectId(id);
    if (!objectId) return { ok: false, message: "Test not found." };
    const result = await col.updateOne({ _id: objectId }, { $set: doc });
    if (result.matchedCount === 0) return { ok: false, message: "Test not found." };
    return { ok: true, id };
  }
  const inserted = await col.insertOne({ ...doc, createdAt: now });
  return { ok: true, id: String(inserted.insertedId) };
}

export async function deleteTest(id: string, confirmedInviteCount: number): Promise<ActionResult> {
  await requireAdmin();
  const objectId = toObjectId(id);
  if (!objectId) return { ok: false, message: "Test not found." };
  const members = await membersCol();
  const invites = await members.countDocuments({ testId: objectId });
  if (invites !== confirmedInviteCount) {
    return {
      ok: false,
      message: `This test now has ${invites} invite(s), not ${confirmedInviteCount}. Refresh the page and try again.`,
    };
  }
  if (invites > 0) await members.deleteMany({ testId: objectId });
  await (await otpsCol()).deleteMany({ testId: objectId });
  await (await testsCol()).deleteOne({ _id: objectId });
  redirect("/admin/tests");
}

function isDuplicateKey(error: unknown): error is { code: number; keyPattern?: Record<string, unknown> } {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000;
}

export async function saveUser(id: string | null, input: unknown): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const parsed = userSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const data = { ...parsed.data, employeeIdKey: parsed.data.employeeId.toUpperCase() };
  const now = new Date();
  const users = await usersCol();
  try {
    if (id) {
      const objectId = toObjectId(id);
      if (!objectId) return { ok: false, message: "User not found." };
      const result = await users.updateOne({ _id: objectId }, { $set: { ...data, updatedAt: now } });
      if (result.matchedCount === 0) return { ok: false, message: "User not found." };
      await (await membersCol()).updateMany(
        { userId: objectId },
        { $set: { name: data.name, email: data.email, employeeId: data.employeeId, role: data.role, skills: data.skills } },
      );
      refresh();
      return { ok: true, id, message: "User updated." };
    }
    const inserted = await users.insertOne({ ...data, createdAt: now, updatedAt: now });
    refresh();
    return { ok: true, id: String(inserted.insertedId), message: `${data.name} added.` };
  } catch (error) {
    if (isDuplicateKey(error)) {
      const field = error.keyPattern && "email" in error.keyPattern ? "employee email" : "employee ID";
      return { ok: false, message: `Another user already has this ${field}.` };
    }
    throw error;
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  await requireAdmin();
  const objectId = toObjectId(id);
  if (!objectId) return { ok: false, message: "User not found." };
  const attempts = await (await membersCol()).countDocuments({ userId: objectId });
  if (attempts > 0) {
    return {
      ok: false,
      message: `This user has ${attempts} test invite(s). Delete those results first so their history is not lost by accident.`,
    };
  }
  await (await usersCol()).deleteOne({ _id: objectId });
  refresh();
  return { ok: true, message: "User deleted." };
}

export async function createTestLink(testIdInput: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const testId = toObjectId(testIdInput);
  if (!testId) return { ok: false, message: "Test not found." };
  const parsed = testLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const tests = await testsCol();
  const test = await tests.findOne({ _id: testId }, { projection: { links: 1 } });
  if (!test) return { ok: false, message: "Test not found." };
  if ((test.links?.length ?? 0) >= 20) return { ok: false, message: "A test can have up to 20 links. Delete one first." };

  const userIds = Array.from(new Set(parsed.data.userIds))
    .map((value) => toObjectId(value))
    .filter((value) => value !== null);
  const link: TestLink = {
    code: newToken(12),
    label: parsed.data.label,
    audience: parsed.data.audience,
    roles: parsed.data.audience === "roles" ? Array.from(new Set(parsed.data.roles)) : [],
    userIds: parsed.data.audience === "users" ? userIds : [],
    enabled: true,
    createdAt: new Date(),
  };
  await tests.updateOne({ _id: testId }, { $push: { links: link }, $set: { updatedAt: new Date() } });
  refresh();
  return { ok: true, message: "Link created." };
}

export async function setTestLinkEnabled(testIdInput: string, code: string, enabled: boolean): Promise<ActionResult> {
  await requireAdmin();
  const testId = toObjectId(testIdInput);
  if (!testId) return { ok: false, message: "Test not found." };
  const result = await (await testsCol()).updateOne({ _id: testId, "links.code": code }, { $set: { "links.$.enabled": enabled } });
  if (result.matchedCount === 0) return { ok: false, message: "Link not found." };
  refresh();
  return { ok: true, message: enabled ? "Link turned on." : "Link turned off. It no longer opens the test." };
}

export async function deleteTestLink(testIdInput: string, code: string): Promise<ActionResult> {
  await requireAdmin();
  const testId = toObjectId(testIdInput);
  if (!testId) return { ok: false, message: "Test not found." };
  const result = await (await testsCol()).updateOne({ _id: testId }, { $pull: { links: { code } } });
  if (result.modifiedCount === 0) return { ok: false, message: "Link not found." };
  refresh();
  return { ok: true, message: "Link deleted." };
}

async function appOrigin(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const store = await headers();
  const host = store.get("x-forwarded-host") ?? store.get("host") ?? "localhost:3000";
  const protocol = store.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function emailTestLink(testIdInput: string, code: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isEmailConfigured()) {
    return { ok: false, message: "Email is not set up. Add RESEND_API_KEY and EMAIL_FROM to the environment variables." };
  }
  const testId = toObjectId(testIdInput);
  const test = testId ? await (await testsCol()).findOne({ _id: testId }) : null;
  const link = test?.links?.find((item) => item.code === code);
  if (!test || !testId || !link) return { ok: false, message: "Link not found." };
  if (!link.enabled) return { ok: false, message: "Turn the link on before emailing it." };

  const audience = await (await usersCol()).find(usersFilterForLink(link)).toArray();
  const submitted = new Set(
    (await (await membersCol()).find({ testId, status: "submitted" }, { projection: { userId: 1 } }).toArray()).map((member) =>
      String(member.userId),
    ),
  );
  const recipients = audience.filter((user) => !submitted.has(String(user._id)));
  if (recipients.length === 0) return { ok: false, message: "Everyone in this link's audience has already submitted." };

  const questions = await (await questionsCol())
    .find({ _id: { $in: test.questionIds } }, { projection: { points: 1 } })
    .toArray();
  const details = {
    questions: questions.length,
    marks: questions.reduce((sum, question) => sum + question.points, 0),
    minutes: test.durationMinutes,
  };
  const url = `${await appOrigin()}/join/${link.code}`;
  const result = await sendBatch(recipients.map((user) => ({ to: user.email, ...inviteEmail(user.name, test.title, url, details) })));
  if (result.sent > 0) {
    await (await testsCol()).updateOne(
      { _id: testId, "links.code": code },
      { $set: { "links.$.lastEmailedAt": new Date(), "links.$.lastEmailedCount": result.sent } },
    );
    refresh();
  }
  if (result.error) {
    return { ok: false, message: `Sent ${result.sent} of ${recipients.length} emails. Resend error: ${result.error}` };
  }
  const skipped = audience.length - recipients.length;
  return {
    ok: true,
    message: `Emailed ${result.sent} employee${result.sent === 1 ? "" : "s"}${skipped ? ` (${skipped} already submitted, skipped)` : ""}.`,
  };
}

export async function deleteMember(id: string): Promise<ActionResult> {
  await requireAdmin();
  const objectId = toObjectId(id);
  if (!objectId) return { ok: false, message: "Member not found." };
  await (await membersCol()).deleteOne({ _id: objectId });
  redirect("/admin/results");
}

const gradesSchema = z.array(
  z.object({
    questionId: z.string(),
    caseResults: z.array(z.object({ passed: z.boolean(), hidden: z.boolean(), error: z.string().max(500).optional() })),
  }),
);

export async function saveCodeGrades(memberId: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const memberObjectId = toObjectId(memberId);
  const parsed = gradesSchema.safeParse(input);
  if (!memberObjectId || !parsed.success) return { ok: false, message: "Invalid grading data." };
  const members = await membersCol();
  const member = await members.findOne({ _id: memberObjectId });
  if (!member) return { ok: false, message: "Member not found." };
  const questionIds = parsed.data.map((grade) => toObjectId(grade.questionId)).filter((value) => value !== null);
  const questions = await (await questionsCol()).find({ _id: { $in: questionIds }, type: "code" }).toArray();
  const byId = new Map(questions.map((question) => [String(question._id), question]));
  const set: Record<string, unknown> = { codeGradedAt: new Date() };
  for (const grade of parsed.data) {
    const question = byId.get(grade.questionId);
    if (question?.type !== "code" || grade.caseResults.length !== question.testCases.length) continue;
    const passed = grade.caseResults.filter((result) => result.passed).length;
    set[`answers.${grade.questionId}.caseResults`] = grade.caseResults;
    set[`answers.${grade.questionId}.autoScore`] = Math.round((passed / question.testCases.length) * question.points * 100) / 100;
    if (!member.answers[grade.questionId]) set[`answers.${grade.questionId}.savedAt`] = new Date();
  }
  await members.updateOne({ _id: memberObjectId }, { $set: set });
  refresh();
  return { ok: true };
}

export async function setManualScore(
  memberId: string,
  questionId: string,
  score: number | null,
  note: string,
): Promise<ActionResult> {
  await requireAdmin();
  const memberObjectId = toObjectId(memberId);
  const questionObjectId = toObjectId(questionId);
  if (!memberObjectId || !questionObjectId) return { ok: false, message: "Not found." };
  const question = await (await questionsCol()).findOne({ _id: questionObjectId });
  if (!question) return { ok: false, message: "Question not found." };
  if (score !== null && (!Number.isFinite(score) || score < 0 || score > question.points)) {
    return { ok: false, message: `Score must be between 0 and ${question.points}.` };
  }
  const path = `answers.${questionId}`;
  const update =
    score === null
      ? { $unset: { [`${path}.manualScore`]: true as const }, $set: { [`${path}.reviewerNote`]: note.slice(0, 1000) } }
      : { $set: { [`${path}.manualScore`]: score, [`${path}.reviewerNote`]: note.slice(0, 1000), [`${path}.savedAt`]: new Date() } };
  await (await membersCol()).updateOne({ _id: memberObjectId }, update);
  refresh();
  return { ok: true, message: "Saved." };
}
