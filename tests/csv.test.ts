import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { initSchema } from "../src/db.ts";
import { seedDemoData } from "../src/seed.ts";
import { exportCsv } from "../src/csv.ts";

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

  test("keeps the header row and one line per expense", () => {
    const lines = exportCsv(setupDb(), "flat-4b").trim().split("\n");
    expect(lines[0]).toBe("date,payer,description,amount");
    expect(lines.length).toBe(4); // header + 3 seeded Flat 4B expenses
  });
});
