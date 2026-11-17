import "server-only";
import { randomInt } from "node:crypto";
import type { ObjectId } from "mongodb";
import { otpsCol } from "./db";
import { safeEqual, sign } from "./auth";

export const OTP_MINUTES = 10;
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_CODES_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

function hash(userId: ObjectId, testId: ObjectId, code: string): string {
  return sign(`otp:${String(userId)}:${String(testId)}:${code}`);
}

export type IssueResult = { ok: true; code: string } | { ok: false; message: string };

export async function issueCode(userId: ObjectId, testId: ObjectId): Promise<IssueResult> {
  const otps = await otpsCol();
  const now = Date.now();
  const recent = await otps
    .find({ userId, testId, createdAt: { $gt: new Date(now - 60 * 60 * 1000) } })
    .sort({ createdAt: -1 })
    .toArray();
  const latest = recent[0];
  if (latest && now - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const seconds = Math.ceil((RESEND_COOLDOWN_MS - (now - latest.createdAt.getTime())) / 1000);
    return { ok: false, message: `A code was just sent. Please wait ${seconds} seconds before asking for another.` };
  }
  if (recent.length >= MAX_CODES_PER_HOUR) {
    return { ok: false, message: "Too many codes requested. Please try again in an hour or contact your admin." };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await otps.insertOne({
    userId,
    testId,
    codeHash: hash(userId, testId, code),
    attempts: 0,
    expiresAt: new Date(now + OTP_MINUTES * 60 * 1000),
    createdAt: new Date(now),
  });
  return { ok: true, code };
}

export async function discardLatestCode(userId: ObjectId, testId: ObjectId): Promise<void> {
  const otps = await otpsCol();
  const latest = await otps.findOne({ userId, testId }, { sort: { createdAt: -1 } });
  if (latest) await otps.deleteOne({ _id: latest._id });
}

export type CheckResult = { ok: true } | { ok: false; message: string };

export async function checkCode(userId: ObjectId, testId: ObjectId, code: string): Promise<CheckResult> {
  const otps = await otpsCol();
  const latest = await otps.findOne({ userId, testId }, { sort: { createdAt: -1 } });
  if (!latest || latest.expiresAt.getTime() < Date.now()) {
    return { ok: false, message: "This code has expired. Request a new one." };
  }
  if (latest.attempts >= MAX_ATTEMPTS) {
    return { ok: false, message: "Too many wrong attempts. Request a new code." };
  }
  if (!/^\d{6}$/.test(code) || !safeEqual(latest.codeHash, hash(userId, testId, code))) {
    await otps.updateOne({ _id: latest._id }, { $inc: { attempts: 1 } });
    const left = MAX_ATTEMPTS - latest.attempts - 1;
    return { ok: false, message: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong attempts. Request a new code." };
  }
  await otps.deleteMany({ userId, testId });
  return { ok: true };
}
