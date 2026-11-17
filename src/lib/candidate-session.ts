import "server-only";
import { cookies } from "next/headers";
import type { ObjectId } from "mongodb";
import { safeEqual, sign } from "./auth";

export const ATTEMPT_COOKIE = "skillcheck_attempt";
const ATTEMPT_HOURS = 12;

function payload(memberId: string, expiresAt: number): string {
  return `attempt:${memberId}:${expiresAt}`;
}

export async function startAttemptSession(memberId: ObjectId): Promise<void> {
  const id = String(memberId);
  const expiresAt = Date.now() + ATTEMPT_HOURS * 60 * 60 * 1000;
  const store = await cookies();
  store.set(ATTEMPT_COOKIE, `${id}.${expiresAt}.${sign(payload(id, expiresAt))}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function verifiedMemberId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(ATTEMPT_COOKIE)?.value;
  if (!raw) return null;
  const [id, expires, signature] = raw.split(".");
  if (!id || !expires || !signature) return null;
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  return safeEqual(signature, sign(payload(id, expiresAt))) ? id : null;
}

export async function isVerifiedFor(memberId: ObjectId | undefined): Promise<boolean> {
  if (!memberId) return false;
  return (await verifiedMemberId()) === String(memberId);
}
