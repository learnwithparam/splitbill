import type { Database } from "bun:sqlite";
import { nanoid } from "nanoid";
import type { AuthedMember, Member, Role } from "../types.ts";

/**
 * Generate a new member token: a readable prefix plus a random nanoid
 * suffix. nanoid is pinned to 3.3.7 (issue #7: GHSA-mwcw-c2x4-8c55).
 */
export function generateToken(prefix: string): string {
  return `${prefix}-${nanoid(10)}`;
}

/** Look up the member behind a bearer token, or null if the token is unknown. */
export function findMemberByToken(db: Database, token: string): AuthedMember | null {
  const row = db
    .query("SELECT id, group_id as groupId, name, role FROM members WHERE token = ?")
    .get(token) as { id: string; groupId: string; name: string; role: Role } | null;
  if (!row) return null;
  return { id: row.id, groupId: row.groupId, name: row.name, role: row.role };
}

export function insertMember(db: Database, member: Member): void {
  db.query(
    "INSERT INTO members (id, group_id, name, token, role) VALUES (?, ?, ?, ?, ?)",
  ).run(member.id, member.groupId, member.name, member.token, member.role);
}
