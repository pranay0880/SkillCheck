import "server-only";
import type { Filter } from "mongodb";
import type { TestLink, UserDoc } from "./types";

export function usersFilterForLink(link: Pick<TestLink, "audience" | "roles" | "userIds">): Filter<UserDoc> {
  if (link.audience === "roles") return { role: { $in: link.roles } };
  if (link.audience === "users") return { _id: { $in: link.userIds } };
  return {};
}

export function isUserInLink(link: Pick<TestLink, "audience" | "roles" | "userIds">, user: Pick<UserDoc, "_id" | "role">): boolean {
  if (link.audience === "roles") return link.roles.includes(user.role);
  if (link.audience === "users") return link.userIds.some((id) => String(id) === String(user._id));
  return true;
}
