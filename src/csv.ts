import type { Database } from "bun:sqlite";
import { formatCents } from "./money/index.ts";

interface ExpenseRow {
  createdAt: string;
  payerName: string;
  description: string;
  amountCents: number;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function fetchExpenseRows(db: Database, groupId: string): ExpenseRow[] {
  return db
    .query(
      `SELECT e.created_at as createdAt, m.name as payerName, e.description as description, e.amount_cents as amountCents
       FROM expenses e JOIN members m ON m.id = e.payer_id
       WHERE e.group_id = ?
       ORDER BY e.created_at ASC`,
    )
    .all(groupId) as ExpenseRow[];
}

/**
 * Build the CSV export for a group's expenses. The amount column is
 * formatted as a decimal ("10.00") here, at the output boundary.
 */
export function exportCsv(db: Database, groupId: string): string {
  const rows = fetchExpenseRows(db, groupId);
  const header = "date,payer,description,amount\n";
  const lines = rows.map(
    (r) =>
      `${r.createdAt},${csvEscape(r.payerName)},${csvEscape(r.description)},${formatCents(r.amountCents)}`,
  );
  return header + lines.join("\n") + (lines.length > 0 ? "\n" : "");
}
