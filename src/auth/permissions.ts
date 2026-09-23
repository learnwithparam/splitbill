import type { AuthedMember, Expense } from "../types.ts";

/** True if the caller belongs to the group at all (any role). */
export function isGroupMember(member: AuthedMember, groupId: string): boolean {
  return member.groupId === groupId;
}

export function isAdmin(member: AuthedMember): boolean {
  return member.role === "admin";
}

/**
 * Can `member` delete `expense`?
 *
 * SEEDED DEFECT (issue #5, IDOR): this only checks that the caller belongs
 * to the same group as the expense. It does NOT check that the caller is
 * the expense's payer or a group admin, so any member can delete any other
 * member's expense. Baseline tests only cover "the payer can delete their
 * own expense" and "a stranger from another group is denied" - neither
 * exercises "a different member of the SAME group" who should also be
 * denied. This is protected-path code (src/auth/**) per .factory/charter.md.
 */
export function canDeleteExpense(member: AuthedMember, expense: Pick<Expense, "groupId" | "payerId">): boolean {
  return member.groupId === expense.groupId;
}
