import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { initSchema } from "../src/db.ts";
import { seedDemoData } from "../src/seed.ts";
import { exportCsv } from "../src/csv.ts";
import { createExpense } from "../src/expenses.ts";

function setupDb(): Database {
  const db = new Database(":memory:");
  initSchema(db);
  seedDemoData(db);
  return db;
}

describe("exportCsv", () => {
  test("formats the amount column as a decimal via formatCents", () => {
    const lines = exportCsv(setupDb(), "flat-4b").trim().split("\n");
    const amounts = lines.slice(1).map((line) => line.split(",").at(-1));
    expect(amounts.sort()).toEqual(["12.00", "30.00", "45.00"]);
  });

  test("keeps a trailing zero cent in the amount column", () => {
    const db = setupDb();
    createExpense(db, {
      groupId: "flat-4b",
      payerId: "flat-priya-id",
      amountCents: 4550,
      description: "Water bill",
      splitAmong: ["flat-priya-id", "flat-imran-id", "flat-sara-id"],
      createdAt: "2026-09-10T09:00:00.000Z", // after the seeded Flat 4B expenses
    });
    const lines = exportCsv(db, "flat-4b").trim().split("\n");
    expect(lines.at(-1)).toEndWith(",Water bill,45.50");
  });

  test("keeps the header row and one line per expense", () => {
    const lines = exportCsv(setupDb(), "flat-4b").trim().split("\n");
    expect(lines[0]).toBe("date,payer,description,amount");
    expect(lines.length).toBe(4); // header + 3 seeded Flat 4B expenses
  });
});
