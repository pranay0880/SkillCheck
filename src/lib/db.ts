import "server-only";
import { promises as dnsPromises, setServers } from "node:dns";
import { MongoClient, type Db, type Collection } from "mongodb";
import type { QuestionDoc, TestDoc, MemberDoc, UserDoc, OtpDoc } from "./types";

export const COLLECTIONS = {
  questions: "questions",
  tests: "tests",
  members: "members",
  users: "users",
  otps: "otps",
} as const;

declare global {
  var __skillcheckMongo: Promise<MongoClient> | undefined;
}

const dnsOverride = process.env.MONGODB_DNS_SERVERS?.split(",")
  .map((server) => server.trim())
  .filter(Boolean);
if (dnsOverride?.length) {
  setServers(dnsOverride);
  dnsPromises.setServers(dnsOverride);
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local and to the Vercel environment variables.");
  }
  globalThis.__skillcheckMongo ??= new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 })
    .connect()
    .catch((error: unknown) => {
      globalThis.__skillcheckMongo = undefined;
      throw error;
    });
  return globalThis.__skillcheckMongo;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB ?? "skilltest");
}

export async function questionsCol(): Promise<Collection<QuestionDoc>> {
  return (await getDb()).collection<QuestionDoc>(COLLECTIONS.questions);
}

export async function testsCol(): Promise<Collection<TestDoc>> {
  return (await getDb()).collection<TestDoc>(COLLECTIONS.tests);
}

export async function membersCol(): Promise<Collection<MemberDoc>> {
  return (await getDb()).collection<MemberDoc>(COLLECTIONS.members);
}

declare global {
  var __skillcheckUserIndexes: Promise<unknown> | undefined;
}

export async function usersCol(): Promise<Collection<UserDoc>> {
  const collection = (await getDb()).collection<UserDoc>(COLLECTIONS.users);
  globalThis.__skillcheckUserIndexes ??= Promise.all([
    collection.createIndex({ employeeIdKey: 1 }, { unique: true, name: "unique_employee_id" }),
    collection.createIndex({ email: 1 }, { unique: true, name: "unique_email" }),
  ]).catch((error: unknown) => {
    globalThis.__skillcheckUserIndexes = undefined;
    throw error;
  });
  await globalThis.__skillcheckUserIndexes;
  return collection;
}

declare global {
  var __skillcheckOtpIndexes: Promise<unknown> | undefined;
}

export async function otpsCol(): Promise<Collection<OtpDoc>> {
  const collection = (await getDb()).collection<OtpDoc>(COLLECTIONS.otps);
  globalThis.__skillcheckOtpIndexes ??= Promise.all([
    collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 3600, name: "expire_old_codes" }),
    collection.createIndex({ userId: 1, testId: 1, createdAt: -1 }, { name: "by_user_test" }),
  ]).catch((error: unknown) => {
    globalThis.__skillcheckOtpIndexes = undefined;
    throw error;
  });
  await globalThis.__skillcheckOtpIndexes;
  return collection;
}
