"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { membersCol, usersCol } from "@/lib/db";
import { finalizeAttempt, isExpired, loadCandidate, type CandidateContext } from "@/lib/candidate";
import { isVerifiedFor, startAttemptSession } from "@/lib/candidate-session";
import { checkCode, discardLatestCode, issueCode, OTP_MINUTES } from "@/lib/otp";
import { canShowDevCode, maskEmail, otpEmail, sendEmail } from "@/lib/email";
import { deadlineFor } from "@/lib/scoring";
import { firstIssue, otpCodeSchema } from "@/lib/validation";
import { TEXT_ANSWER_MAX_LENGTH, type ActionResult } from "@/lib/types";

const NOT_VERIFIED = "Your session has expired. Reload the page and verify again with the code sent to your email.";
const OTHER_DEVICE = "This test is open on another device or browser tab. Continue there, or close it and try again here in about a minute.";
const SESSION_STALE_MS = 50 * 1000;
const SESSION_ID_PATTERN = /^[\w-]{8,64}$/;

async function loadVerified(token: string): Promise<CandidateContext | null> {
  const context = await loadCandidate(token);
  if (!context || !(await isVerifiedFor(context.member._id))) return null;
  return context;
}

async function holdSession(context: CandidateContext, sessionId: string, countConflict: boolean): Promise<boolean> {
  if (!SESSION_ID_PATTERN.test(sessionId) || !context.member._id) return false;
  const now = new Date();
  const members = await membersCol();
  const claimed = await members.updateOne(
    {
      _id: context.member._id,
      $or: [
        { activeSession: { $exists: false } },
        { "activeSession.id": sessionId },
        { "activeSession.lastSeen": { $lt: new Date(now.getTime() - SESSION_STALE_MS) } },
      ],
    },
    { $set: { activeSession: { id: sessionId, lastSeen: now } } },
  );
  if (claimed.matchedCount > 0) return true;
  if (countConflict) {
    await members.updateOne(
      { _id: context.member._id, lastConflictSession: { $ne: sessionId } },
      { $inc: { deviceConflicts: 1 }, $set: { lastConflictSession: sessionId } },
    );
  }
  return false;
}

export async function claimSession(token: string, sessionId: string, firstClaim: boolean): Promise<ActionResult & { blocked?: boolean }> {
  const context = await loadVerified(token);
  if (!context) return { ok: false, message: NOT_VERIFIED };
  if (context.member.status === "submitted") return { ok: false, message: "This test has been submitted." };
  const held = await holdSession(context, sessionId, firstClaim);
  return held ? { ok: true } : { ok: false, blocked: true, message: OTHER_DEVICE };
}

export async function recordFullscreenExit(token: string, sessionId: string): Promise<void> {
  const context = await loadVerified(token);
  if (context?.member.status !== "in_progress" || !(await holdSession(context, sessionId, false))) return;
  await (await membersCol()).updateOne({ _id: context.member._id }, { $inc: { fullscreenExits: 1 } });
}

export async function recordFullscreenUnsupported(token: string): Promise<void> {
  const context = await loadVerified(token);
  if (context?.member.status !== "in_progress") return;
  await (await membersCol()).updateOne({ _id: context.member._id }, { $set: { fullscreenUnsupported: true } });
}

export async function startTest(token: string): Promise<ActionResult & { deadline?: string }> {
  const context = await loadVerified(token);
  if (!context) return { ok: false, message: NOT_VERIFIED };
  const { member, test } = context;
  if (member.status === "submitted") return { ok: false, message: "You have already submitted this test." };
  if (member.status === "invited") {
    const startedAt = new Date();
    await (await membersCol()).updateOne(
      { _id: member._id, status: "invited" },
      { $set: { status: "in_progress", startedAt } },
    );
    return { ok: true, deadline: deadlineFor(startedAt, test.durationMinutes).toISOString() };
  }
  return { ok: true, deadline: deadlineFor(member.startedAt ?? new Date(), test.durationMinutes).toISOString() };
}

const answerSchema = z.union([
  z.strictObject({ selectedOptionIds: z.array(z.string().max(8)).max(8) }),
  z.strictObject({ code: z.string().max(20000) }),
  z.strictObject({ text: z.string().max(TEXT_ANSWER_MAX_LENGTH) }),
]);

export async function saveAnswer(token: string, sessionId: string, questionId: string, input: unknown): Promise<ActionResult & { blocked?: boolean }> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid answer." };
  const context = await loadVerified(token);
  if (!context) return { ok: false, message: NOT_VERIFIED };
  const { member, test } = context;
  if (member.status !== "in_progress" || isExpired(member, test)) {
    return { ok: false, message: "This test is closed." };
  }
  if (!(await holdSession(context, sessionId, false))) return { ok: false, blocked: true, message: OTHER_DEVICE };
  if (!member.questionOrder.some((id) => String(id) === questionId)) {
    return { ok: false, message: "Question not in this test." };
  }
  await (await membersCol()).updateOne(
    { _id: member._id, status: "in_progress" },
    { $set: { [`answers.${questionId}`]: { ...parsed.data, savedAt: new Date() } } },
  );
  return { ok: true };
}

export async function recordTabSwitch(token: string, sessionId: string): Promise<void> {
  const context = await loadVerified(token);
  if (context?.member.status !== "in_progress" || !(await holdSession(context, sessionId, false))) return;
  await (await membersCol()).updateOne({ _id: context.member._id }, { $inc: { tabSwitches: 1 } });
}

export async function submitTest(token: string, sessionId: string): Promise<ActionResult & { blocked?: boolean }> {
  const context = await loadVerified(token);
  if (!context) return { ok: false, message: NOT_VERIFIED };
  if (context.member.status === "invited") return { ok: false, message: "The test has not started." };
  if (context.member.status === "in_progress" && !(await holdSession(context, sessionId, false))) {
    return { ok: false, blocked: true, message: OTHER_DEVICE };
  }
  await finalizeAttempt(context.member);
  return { ok: true };
}

export interface AttemptCodeState extends ActionResult {
  sent: boolean;
  devCode?: string;
}

export async function sendAttemptCode(token: string): Promise<AttemptCodeState> {
  const context = await loadCandidate(token);
  const userId = context?.member.userId;
  if (!context?.member._id || !userId) return { ok: false, sent: false, message: "This test link is not valid." };
  const { member, test } = context;
  const testId = test._id ?? member.testId;
  if (member.status === "submitted") return { ok: false, sent: false, message: "This test has already been submitted." };
  const user = await (await usersCol()).findOne({ _id: userId });
  if (!user) return { ok: false, sent: false, message: "Your employee record was not found. Contact your admin." };

  const issued = await issueCode(userId, testId);
  if (!issued.ok) return { ok: false, sent: true, message: issued.message };
  if (canShowDevCode()) return { ok: true, sent: true, devCode: issued.code, message: `Code sent to ${maskEmail(user.email)}.` };
  const result = await sendEmail({ to: user.email, ...otpEmail(user.name, test.title, issued.code, OTP_MINUTES) });
  if (!result.ok) {
    await discardLatestCode(userId, testId);
    return { ok: false, sent: false, message: "We couldn't send the code email. Please try again or contact your admin." };
  }
  return { ok: true, sent: true, message: `Code sent to ${maskEmail(user.email)}.` };
}

export async function verifyAttemptCode(token: string, formData: FormData): Promise<ActionResult> {
  const otp = otpCodeSchema.safeParse(formData.get("otp"));
  if (!otp.success) return { ok: false, message: firstIssue(otp.error) };
  const context = await loadCandidate(token);
  if (!context?.member._id || !context.member.userId) return { ok: false, message: "This test link is not valid." };
  const checked = await checkCode(context.member.userId, context.test._id ?? context.member.testId, otp.data);
  if (!checked.ok) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { ok: false, message: checked.message };
  }
  await startAttemptSession(context.member._id);
  refresh();
  return { ok: true };
}
