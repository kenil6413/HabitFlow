import { ObjectId } from 'mongodb';

export function toObjectIdOrNull(value) {
  if (!ObjectId.isValid(value)) return null;
  return new ObjectId(value);
}
