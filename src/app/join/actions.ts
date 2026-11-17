"use server";

import { redirect } from "next/navigation";
import type { ObjectId } from "mongodb";
import { membersCol, questionsCol, testsCol, usersCol } from "@/lib/db";
import { buildMember } from "@/lib/invites";
import { isUserInLink } from "@/lib/audience";
import { checkCode, discardLatestCode, issueCode, OTP_MINUTES } from "@/lib/otp";
import { canShowDevCode, maskEmail, otpEmail, sendEmail } from "@/lib/email";
import { startAttemptSession } from "@/lib/candidate-session";
import { firstIssue, joinSchema, otpCodeSchema } from "@/lib/validation";
import type { ActionResult, TestDoc, TestLink, UserDoc } from "@/lib/types";

const CODE_PATTERN = /^[\w-]{10,40}$/;
const FAILURE_DELAY_MS = 600;
const NO_MATCH = "We couldn't find an employee with that email and employee ID. Check both and try again, or contact your admin.";

export interface JoinState extends ActionResult {
  step: "details" | "code";
  email?: string;
  employeeId?: string;
  maskedEmail?: string;
  devCode?: string;
}

async function slow<T>(value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
  return value;
}

type Resolved =
  | { ok: true; test: TestDoc & { _id: ObjectId }; link: TestLink; user: UserDoc & { _id: ObjectId } }
  | { ok: false; message: string };

async function resolve(code: string, email: string, employeeId: string): Promise<Resolved> {
  if (!CODE_PATTERN.test(code)) return { ok: false, message: "This test link is not valid." };
  const test = await (await testsCol()).findOne({ links: { $elemMatch: { code, enabled: true } } });
  const link = test?.links?.find((item) => item.code === code);
  if (!test?._id || !link) return { ok: false, message: "This test link is not active. Contact your admin." };
  const user = await (await usersCol()).findOne({ email, employeeIdKey: employeeId.toUpperCase() });
  if (!user?._id) return slow({ ok: false, message: NO_MATCH });
  if (!isUserInLink(link, user)) {
    return { ok: false, message: `This link is not for you. Contact your admin if you should take “${test.title}”.` };
  }
  const latest = await (await membersCol()).findOne({ testId: test._id, userId: user._id }, { sort: { createdAt: -1 } });
  if (latest?.status === "submitted") {
    return { ok: false, message: `You have already submitted “${test.title}”. Contact your admin if you need another attempt.` };
  }
  return { ok: true, test: { ...test, _id: test._id }, link, user: { ...user, _id: user._id } };
}

export async function requestJoinCode(code: string, _prev: JoinState | null, formData: FormData): Promise<JoinState> {
  const parsed = joinSchema.safeParse({ email: formData.get("email"), employeeId: formData.get("employeeId") });
  if (!parsed.success) return { ok: false, step: "details", message: firstIssue(parsed.error) };
  const { email, employeeId } = parsed.data;
  const resolved = await resolve(code, email, employeeId);
  if (!resolved.ok) return { ok: false, step: "details", message: resolved.message, email, employeeId };

  const issued = await issueCode(resolved.user._id, resolved.test._id);
  if (!issued.ok) return { ok: false, step: "code", message: issued.message, email, employeeId, maskedEmail: maskEmail(email) };

  if (canShowDevCode()) {
    return { ok: true, step: "code", email, employeeId, maskedEmail: maskEmail(email), devCode: issued.code };
  }
  const sent = await sendEmail({ to: resolved.user.email, ...otpEmail(resolved.user.name, resolved.test.title, issued.code, OTP_MINUTES) });
  if (!sent.ok) {
    await discardLatestCode(resolved.user._id, resolved.test._id);
    const detail = process.env.NODE_ENV === "development" && sent.error ? ` (Development detail from Resend: ${sent.error})` : "";
    return {
      ok: false,
      step: "details",
      message: `We couldn't send the code email. Please try again or contact your admin.${detail}`,
      email,
      employeeId,
    };
  }
  return { ok: true, step: "code", email, employeeId, maskedEmail: maskEmail(email) };
}

export async function verifyJoinCode(code: string, _prev: JoinState | null, formData: FormData): Promise<JoinState> {
  const parsed = joinSchema.safeParse({ email: formData.get("email"), employeeId: formData.get("employeeId") });
  if (!parsed.success) return { ok: false, step: "details", message: firstIssue(parsed.error) };
  const { email, employeeId } = parsed.data;
  const base = { email, employeeId, maskedEmail: maskEmail(email) };
  const otp = otpCodeSchema.safeParse(formData.get("otp"));
  if (!otp.success) return { ok: false, step: "code", message: firstIssue(otp.error), ...base };

  const resolved = await resolve(code, email, employeeId);
  if (!resolved.ok) return { ok: false, step: "details", message: resolved.message, email, employeeId };
  const checked = await checkCode(resolved.user._id, resolved.test._id, otp.data);
  if (!checked.ok) return slow({ ok: false, step: "code", message: checked.message, ...base });

  const members = await membersCol();
  let member = await members.findOne(
    { testId: resolved.test._id, userId: resolved.user._id, status: { $ne: "submitted" } },
    { sort: { createdAt: -1 } },
  );
  if (!member) {
    const types = await (await questionsCol())
      .find({ _id: { $in: resolved.test.questionIds } }, { projection: { type: 1 } })
      .toArray();
    const typeById = new Map(types.map((question) => [String(question._id), question.type]));
    const created = buildMember(resolved.test, resolved.user, new Date(), typeById);
    const inserted = await members.insertOne(created);
    member = { ...created, _id: inserted.insertedId };
  }
  if (!member._id) return { ok: false, step: "details", message: "Could not start the test. Please try again.", email, employeeId };
  await startAttemptSession(member._id);
  redirect(`/t/${member.token}`);
}
