import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const ADMIN_COOKIE = "skillcheck_admin";
const SESSION_HOURS = 12;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 16 characters.");
  }
  return secret;
}

export function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isCorrectAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD is not set.");
  }
  return safeEqual(sign(candidate), sign(expected));
}

export async function startAdminSession(): Promise<void> {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `admin:${expiresAt}`;
  const store = await cookies();
  store.set(ADMIN_COOKIE, `${expiresAt}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  await connection();
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  if (!raw) return false;
  const [expiresAt, signature] = raw.split(".");
  if (!expiresAt || !signature) return false;
  if (Number(expiresAt) < Date.now()) return false;
  return safeEqual(signature, sign(`admin:${expiresAt}`));
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}
