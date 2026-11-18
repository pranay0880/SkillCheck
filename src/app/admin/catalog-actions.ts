"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG, catalogKey, resolveSkills } from "@/lib/catalog";
import { resultsCol, questionsCol, rolesCol, skillsCol, testsCol, usersCol } from "@/lib/db";
import { toObjectId } from "@/lib/ids";
import { pluralize } from "@/lib/format";
import { firstIssue, roleSchema, skillNameSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

function catalogChanged(): void {
  updateTag(CATALOG_TAG);
  refresh();
}

function usageMessage(name: string, parts: string[]): string {
  return `“${name}” is used by ${parts.join(" and ")}. Change those first.`;
}

export async function addSkill(input: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = skillNameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const name = parsed.data;
  const skills = await skillsCol();
  const result = await skills.updateOne(
    { key: catalogKey(name) },
    { $setOnInsert: { name, key: catalogKey(name), createdAt: new Date() } },
    { upsert: true },
  );
  if (result.upsertedCount === 0) return { ok: false, message: `“${name}” already exists.` };
  catalogChanged();
  return { ok: true, message: `Added ${name}.` };
}

export async function renameSkill(id: string, input: string): Promise<ActionResult> {
  await requireAdmin();
  const objectId = toObjectId(id);
  const parsed = skillNameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const skills = await skillsCol();
  const current = objectId ? await skills.findOne({ _id: objectId }) : null;
  if (!current) return { ok: false, message: "Skill not found." };
  const name = parsed.data;
  if (name === current.name) return { ok: true };
  const key = catalogKey(name);
  if (key !== current.key && (await skills.countDocuments({ key })) > 0) {
    return { ok: false, message: `“${name}” already exists.` };
  }
  const old = current.name;
  await skills.updateOne({ _id: current._id }, { $set: { name, key } });
  const arrayRename = { $set: { "skills.$[skill]": name } };
  const arrayOptions = { arrayFilters: [{ skill: old }] };
  await Promise.all([
    (await rolesCol()).updateMany({ skills: old }, arrayRename, arrayOptions),
    (await usersCol()).updateMany({ skills: old }, arrayRename, arrayOptions),
    (await resultsCol()).updateMany({ skills: old }, arrayRename, arrayOptions),
    (await questionsCol()).updateMany({ skill: old }, { $set: { skill: name } }),
  ]);
  catalogChanged();
  return { ok: true, message: `Renamed to ${name}.` };
}

export async function deleteSkill(id: string): Promise<ActionResult> {
  await requireAdmin();
  const objectId = toObjectId(id);
  const skills = await skillsCol();
  const current = objectId ? await skills.findOne({ _id: objectId }) : null;
  if (!current) return { ok: false, message: "Skill not found." };
  const [questionCount, userCount] = await Promise.all([
    (await questionsCol()).countDocuments({ skill: current.name }),
    (await usersCol()).countDocuments({ skills: current.name }),
  ]);
  const usage = [
    questionCount ? pluralize(questionCount, "question") : null,
    userCount ? pluralize(userCount, "user") : null,
  ].filter((part) => part !== null);
  if (usage.length > 0) return { ok: false, message: usageMessage(current.name, usage) };
  await skills.deleteOne({ _id: current._id });
  await (await rolesCol()).updateMany({ skills: current.name }, { $pull: { skills: current.name } });
  catalogChanged();
  return { ok: true, message: `Deleted ${current.name}.` };
}

export async function saveRole(id: string | null, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const resolved = await resolveSkills(parsed.data.skills);
  if (resolved.unknown.length > 0) return { ok: false, message: `Unknown skill: ${resolved.unknown.join(", ")}.` };
  const name = parsed.data.name;
  const key = catalogKey(name);
  const skills = Array.from(new Set(resolved.names));
  const roles = await rolesCol();
  const clash = await roles.findOne({ key }, { projection: { _id: 1 } });
  const now = new Date();

  if (!id) {
    if (clash) return { ok: false, message: `A role called “${name}” already exists.` };
    await roles.insertOne({ name, key, skills, createdAt: now, updatedAt: now });
    catalogChanged();
    return { ok: true, message: `Added ${name}.` };
  }

  const objectId = toObjectId(id);
  const current = objectId ? await roles.findOne({ _id: objectId }) : null;
  if (!current) return { ok: false, message: "Role not found." };
  if (clash && String(clash._id) !== String(current._id)) {
    return { ok: false, message: `A role called “${name}” already exists.` };
  }
  await roles.updateOne({ _id: current._id }, { $set: { name, key, skills, updatedAt: now } });
  if (current.name !== name) {
    const old = current.name;
    await Promise.all([
      (await usersCol()).updateMany({ role: old }, { $set: { role: name } }),
      (await resultsCol()).updateMany({ role: old }, { $set: { role: name } }),
      (await testsCol()).updateMany(
        { "links.roles": old },
        { $set: { "links.$[].roles.$[role]": name } },
        { arrayFilters: [{ role: old }] },
      ),
    ]);
  }
  catalogChanged();
  return { ok: true, message: `Saved ${name}.` };
}

export async function deleteRole(id: string): Promise<ActionResult> {
  await requireAdmin();
  const objectId = toObjectId(id);
  const roles = await rolesCol();
  const current = objectId ? await roles.findOne({ _id: objectId }) : null;
  if (!current) return { ok: false, message: "Role not found." };
  const [userCount, linkCount] = await Promise.all([
    (await usersCol()).countDocuments({ role: current.name }),
    (await testsCol()).countDocuments({ "links.roles": current.name }),
  ]);
  const usage = [
    userCount ? pluralize(userCount, "user") : null,
    linkCount ? `${pluralize(linkCount, "test")} with role links` : null,
  ].filter((part) => part !== null);
  if (usage.length > 0) return { ok: false, message: usageMessage(current.name, usage) };
  await roles.deleteOne({ _id: current._id });
  catalogChanged();
  return { ok: true, message: `Deleted ${current.name}.` };
}
