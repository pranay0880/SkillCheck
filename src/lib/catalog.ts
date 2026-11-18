import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_ROLES, DEFAULT_SKILLS, sortSkills } from "@/data/skills";
import { resultsCol, questionsCol, rolesCol, skillsCol, usersCol } from "./db";
import type { Catalog } from "./types";

export const CATALOG_TAG = "catalog";

export function catalogKey(name: string): string {
  return name.trim().toLowerCase();
}

declare global {
  var __skillcheckCatalogSeed: Promise<void> | undefined;
}

async function seedIfEmpty(): Promise<void> {
  const skills = await skillsCol();
  if ((await skills.estimatedDocumentCount()) > 0) return;
  const roles = await rolesCol();
  const users = await usersCol();
  const [questionSkills, userSkills, memberSkills, userRoles] = await Promise.all([
    (await questionsCol()).distinct("skill"),
    users.distinct("skills"),
    (await resultsCol()).distinct("skills"),
    users.distinct("role"),
  ]);
  const now = new Date();
  const names = sortSkills(
    [...DEFAULT_SKILLS, ...questionSkills, ...userSkills, ...memberSkills].map((name) => String(name).trim()).filter(Boolean),
  );
  await ensureSkills(names, now);
  const roleSeeds = [
    ...DEFAULT_ROLES,
    ...userRoles
      .map((name) => String(name).trim())
      .filter((name) => name && !DEFAULT_ROLES.some((role) => catalogKey(role.name) === catalogKey(name)))
      .map((name) => ({ name, skills: [] })),
  ];
  await roles.bulkWrite(
    roleSeeds.map((role) => ({
      updateOne: {
        filter: { key: catalogKey(role.name) },
        update: { $setOnInsert: { name: role.name, key: catalogKey(role.name), skills: role.skills, createdAt: now, updatedAt: now } },
        upsert: true,
      },
    })),
  );
}

export async function ensureSkills(names: string[], now = new Date()): Promise<void> {
  const unique = sortSkills(names.map((name) => name.trim()).filter(Boolean));
  if (unique.length === 0) return;
  await (await skillsCol()).bulkWrite(
    unique.map((name) => ({
      updateOne: {
        filter: { key: catalogKey(name) },
        update: { $setOnInsert: { name, key: catalogKey(name), createdAt: now } },
        upsert: true,
      },
    })),
  );
}

async function ensureSeeded(): Promise<void> {
  globalThis.__skillcheckCatalogSeed ??= seedIfEmpty().catch((error: unknown) => {
    globalThis.__skillcheckCatalogSeed = undefined;
    throw error;
  });
  await globalThis.__skillcheckCatalogSeed;
}

export async function loadCatalog(): Promise<Catalog> {
  await ensureSeeded();
  const [skills, roles] = await Promise.all([
    (await skillsCol()).find({}, { projection: { name: 1 } }).toArray(),
    (await rolesCol()).find({}, { projection: { name: 1, skills: 1 } }).toArray(),
  ]);
  return {
    skills: sortSkills(skills.map((skill) => skill.name)),
    roles: roles
      .map((role) => ({ id: String(role._id), name: role.name, skills: sortSkills(role.skills) }))
      .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" })),
  };
}

export async function loadPublicCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return loadCatalog();
}

export async function resolveSkills(names: string[]): Promise<{ names: string[]; unknown: string[] }> {
  if (names.length === 0) return { names: [], unknown: [] };
  const docs = await (await skillsCol()).find({ key: { $in: names.map(catalogKey) } }, { projection: { key: 1, name: 1 } }).toArray();
  const byKey = new Map(docs.map((doc) => [doc.key, doc.name]));
  return {
    names: names.map((name) => byKey.get(catalogKey(name)) ?? name),
    unknown: names.filter((name) => !byKey.has(catalogKey(name))),
  };
}

export async function findRoleName(name: string): Promise<string | null> {
  const role = await (await rolesCol()).findOne({ key: catalogKey(name) }, { projection: { name: 1 } });
  return role?.name ?? null;
}
