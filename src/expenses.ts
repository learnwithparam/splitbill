import type { Database } from "bun:sqlite";
import { splitCents } from "./money/cents.ts";
import type { Expense } from "./types.ts";

export interface NewExpenseInput {
  groupId: string;
  payerId: string;
  amountCents: number;
  description: string;
  splitAmong: string[];
  /** Override the created_at timestamp (used by seed data to keep insertion order distinct). */
  createdAt?: string;
}

export interface ExpenseWithPayer extends Expense {
  payerName: string;
}

export function createExpense(db: Database, input: NewExpenseInput): Expense {
  const expense: Expense = {
    id: crypto.randomUUID(),
    groupId: input.groupId,
    payerId: input.payerId,
    amountCents: input.amountCents,
    description: input.description,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  const shares = splitCents(input.amountCents, input.splitAmong);

  const insertExpense = db.query(
    `INSERT INTO expenses (id, group_id, payer_id, amount_cents, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insertShare = db.query(
    `INSERT INTO expense_shares (expense_id, member_id, share_cents) VALUES (?, ?, ?)`,
  );
  db.transaction(() => {
    insertExpense.run(expense.id, expense.groupId, expense.payerId, expense.amountCents, expense.description, expense.createdAt);
    for (const [memberId, shareCents] of Object.entries(shares)) {
      insertShare.run(expense.id, memberId, shareCents);
    }
  })();

  return expense;
}

export interface ListExpensesOptions {
  query?: string;
  limit?: number;
  cursor?: string; // keyset cursor: an expense id from the previous page
}

/**
 * List (and optionally search) a group's expenses, newest first, keyset
 * paginated.
 */
export function listExpenses(db: Database, groupId: string, options: ListExpensesOptions = {}): ExpenseWithPayer[] {
  const limit = Math.min(options.limit ?? 20, 100);
  const conditions = ["e.group_id = ?"];
  const params: (string | number)[] = [groupId];
  if (options.cursor) {
    conditions.push("e.created_at < (SELECT created_at FROM expenses WHERE id = ?)");
    params.push(options.cursor);
  }
  const { query } = options;
  if (query) {
    conditions.push("e.description LIKE ?");
    params.push(`%${query}%`);
  }
  const sql = `
    SELECT e.id, e.group_id as groupId, e.payer_id as payerId, e.amount_cents as amountCents,
           e.description, e.created_at as createdAt, m.name as payerName
    FROM expenses e JOIN members m ON m.id = e.payer_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY e.created_at DESC
    LIMIT ?
  `;
  params.push(limit);
  return db.query(sql).all(...params) as ExpenseWithPayer[];
}

export function findExpense(db: Database, groupId: string, expenseId: string): Expense | null {
  const row = db
    .query(
      `SELECT id, group_id as groupId, payer_id as payerId, amount_cents as amountCents, description, created_at as createdAt
       FROM expenses WHERE id = ? AND group_id = ?`,
    )
    .get(expenseId, groupId) as Expense | null;
  return row ?? null;
}

export function deleteExpense(db: Database, expenseId: string): void {
  db.transaction(() => {
    db.query("DELETE FROM expense_shares WHERE expense_id = ?").run(expenseId);
    db.query("DELETE FROM expenses WHERE id = ?").run(expenseId);
  })();
}
