import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { initSchema } from "../src/db.ts";
import { seedDemoData } from "../src/seed.ts";
import { exportCsv } from "../src/csv.ts";
import { formatCents } from "../src/money/index.ts";

function setupDb(): Database {
  const db = new Database(":memory:");
  initSchema(db);
  seedDemoData(db);
  return db;
}

function storedCents(db: Database, groupId: string): number[] {
  const rows = db
    .query("SELECT amount_cents as amountCents FROM expenses WHERE group_id = ? ORDER BY created_at ASC")
    .all(groupId) as { amountCents: number }[];
  return rows.map((r) => r.amountCents);
}

describe("exportCsv", () => {
  test("exportCsv formats the amount column with formatCents", () => {
    const db = setupDb();
    const lines = exportCsv(db, "flat-4b").trimEnd().split("\n").slice(1);
    const amounts = lines.map((line) => line.split(",").at(-1));
    const cents = storedCents(db, "flat-4b");

    expect(amounts).toEqual(cents.map(formatCents));
    for (const amount of amounts) {
      expect(amount).toMatch(/^-?\d+\.\d{2}$/);
    }
    expect(amounts[0]).toBe("45.00");
  });

  test("exportCsv keeps the header and one row per expense", () => {
    const db = setupDb();
    const csv = exportCsv(db, "flat-4b");
    const lines = csv.trimEnd().split("\n");

    expect(lines[0]).toBe("date,payer,description,amount");
    expect(lines.length - 1).toBe(storedCents(db, "flat-4b").length);
    expect(csv.endsWith("\n")).toBe(true);
  });
});
