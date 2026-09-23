import type { Database } from "bun:sqlite";
import { isSeeded } from "./db.ts";
import { insertMember } from "./auth/tokens.ts";
import { createExpense } from "./expenses.ts";
import type { Member } from "./types.ts";

const GOA_DESCRIPTIONS = [
  "Auto rickshaw",
  "Beach shack lunch",
  "Scooter rental",
  "Sunset cruise tickets",
  "Water sports",
  "Breakfast at cafe",
  "Fuel",
  "Bar tab",
  "Late night snacks",
  "Grocery run",
  "Taxi to airport",
  "Hostel extra night",
  "Kayaking",
  "Souvenirs",
  "Coconut water stand",
  "Dinner at shack",
  "Spice market",
  "Boat party tickets",
  "Laundry",
  "Bike rental",
  "Coffee",
  "Ice cream",
  "Parking",
  "SIM card",
  "Farewell dinner",
];

/** Idempotent: seeds the two demo groups only if the database is empty. */
export function seedDemoData(db: Database): void {
  if (isSeeded(db)) return;

  db.query("INSERT INTO groups (id, name) VALUES (?, ?)").run("goa-trip", "Goa trip");
  db.query("INSERT INTO groups (id, name) VALUES (?, ?)").run("flat-4b", "Flat 4B");

  const goaMembers: Member[] = [
    { id: "goa-asha-id", groupId: "goa-trip", name: "Asha", token: "goa-asha", role: "admin" },
    { id: "goa-ben-id", groupId: "goa-trip", name: "Ben", token: "goa-ben", role: "member" },
    { id: "goa-chetan-id", groupId: "goa-trip", name: "Chetan", token: "goa-chetan", role: "member" },
    { id: "goa-divya-id", groupId: "goa-trip", name: "Divya", token: "goa-divya", role: "member" },
  ];
  for (const m of goaMembers) insertMember(db, m);

  const flatMembers: Member[] = [
    { id: "flat-priya-id", groupId: "flat-4b", name: "Priya", token: "flat-priya", role: "admin" },
    { id: "flat-imran-id", groupId: "flat-4b", name: "Imran", token: "flat-imran", role: "member" },
    { id: "flat-sara-id", groupId: "flat-4b", name: "Sara", token: "flat-sara", role: "member" },
  ];
  for (const m of flatMembers) insertMember(db, m);

  // Trip started a week ago; each expense is an hour after the last so
  // created_at is strictly increasing (keyset pagination needs a stable order).
  const tripStart = Date.parse("2026-09-16T09:00:00.000Z");

  const goaIds = goaMembers.map((m) => m.id);
  GOA_DESCRIPTIONS.forEach((description, i) => {
    const payerId = goaIds[i % goaIds.length]!;
    const amountCents = 300 + ((i * 137) % 4000); // varied, deterministic amounts
    createExpense(db, {
      groupId: "goa-trip",
      payerId,
      amountCents,
      description,
      splitAmong: goaIds,
      createdAt: new Date(tripStart + i * 3_600_000).toISOString(),
    });
  });

  const flatIds = flatMembers.map((m) => m.id);
  const flatStart = Date.parse("2026-09-01T09:00:00.000Z");
  const flatExpenses = [
    { payer: "flat-priya-id", amount: 4500, desc: "Electricity bill" },
    { payer: "flat-imran-id", amount: 1200, desc: "Groceries" },
    { payer: "flat-sara-id", amount: 3000, desc: "Internet bill" },
  ];
  flatExpenses.forEach((e, i) => {
    createExpense(db, {
      groupId: "flat-4b",
      payerId: e.payer,
      amountCents: e.amount,
      description: e.desc,
      splitAmong: flatIds,
      createdAt: new Date(flatStart + i * 86_400_000).toISOString(),
    });
  });
}
