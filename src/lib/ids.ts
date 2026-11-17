import { ObjectId } from "mongodb";

export function toObjectId(value: string): ObjectId | null {
  return ObjectId.isValid(value) && /^[a-f\d]{24}$/i.test(value) ? new ObjectId(value) : null;
}
