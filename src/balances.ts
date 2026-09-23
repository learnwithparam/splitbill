import type { Database } from "bun:sqlite";
import type { Transfer } from "./types.ts";

export interface MemberBalance {
  memberId: string;
  name: string;
  paidCents: number;
  owedCents: number;
  netCents: number; // positive: is owed money; negative: owes money
}

/** Net balance per member: what they paid minus what they owe, across all expenses in the group. */
export function computeBalances(db: Database, groupId: string): MemberBalance[] {
  const members = db
    .query("SELECT id, name FROM members WHERE group_id = ?")
    .all(groupId) as { id: string; name: string }[];

  const paid = new Map<string, number>();
  const owed = new Map<string, number>();

  const paidRows = db
    .query(
      `SELECT payer_id as payerId, SUM(amount_cents) as total
       FROM expenses WHERE group_id = ? GROUP BY payer_id`,
    )
    .all(groupId) as { payerId: string; total: number }[];
  for (const row of paidRows) paid.set(row.payerId, row.total);

  const owedRows = db
    .query(
      `SELECT s.member_id as memberId, SUM(s.share_cents) as total
       FROM expense_shares s
       JOIN expenses e ON e.id = s.expense_id
       WHERE e.group_id = ?
       GROUP BY s.member_id`,
    )
    .all(groupId) as { memberId: string; total: number }[];
  for (const row of owedRows) owed.set(row.memberId, row.total);

  return members.map((m) => {
    const paidCents = paid.get(m.id) ?? 0;
    const owedCents = owed.get(m.id) ?? 0;
    return { memberId: m.id, name: m.name, paidCents, owedCents, netCents: paidCents - owedCents };
  });
}

/** Minimal set of transfers that settles every balance to zero (greedy largest-first matching). */
export function settleUp(balances: MemberBalance[]): Transfer[] {
  const creditors = balances
    .filter((b) => b.netCents > 0)
    .map((b) => ({ id: b.memberId, amount: b.netCents }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances
    .filter((b) => b.netCents < 0)
    .map((b) => ({ id: b.memberId, amount: -b.netCents }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]!;
    const debtor = debtors[di]!;
    const amount = Math.min(creditor.amount, debtor.amount);
    if (amount > 0) {
      transfers.push({ fromMemberId: debtor.id, toMemberId: creditor.id, amountCents: amount });
    }
    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount === 0) ci++;
    if (debtor.amount === 0) di++;
  }
  return transfers;
}
