import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { initSchema } from "../src/db.ts";
import { insertMember, findMemberByToken, generateToken } from "../src/auth/tokens.ts";
import { canDeleteExpense, isAdmin, isGroupMember } from "../src/auth/permissions.ts";

function setupDb(): Database {
  const db = new Database(":memory:");
  initSchema(db);
  db.query("INSERT INTO groups (id, name) VALUES (?, ?)").run("g1", "Group One");
  insertMember(db, { id: "m1", groupId: "g1", name: "Alice", token: "g1-alice", role: "admin" });
  insertMember(db, { id: "m2", groupId: "g1", name: "Bob", token: "g1-bob", role: "member" });
  return db;
}

describe("tokens", () => {
  test("finds a member by their token", () => {
    const db = setupDb();
    const member = findMemberByToken(db, "g1-bob");
    expect(member).toEqual({ id: "m2", groupId: "g1", name: "Bob", role: "member" });
  });

  test("returns null for an unknown token", () => {
    const db = setupDb();
    expect(findMemberByToken(db, "no-such-token")).toBeNull();
  });

  test("generateToken includes the given prefix", () => {
    const token = generateToken("g1");
    expect(token.startsWith("g1-")).toBe(true);
    expect(token.length).toBeGreaterThan("g1-".length);
  });
});

describe("permissions", () => {
  test("isGroupMember / isAdmin reflect membership and role", () => {
    const alice = { id: "m1", groupId: "g1", name: "Alice", role: "admin" as const };
    expect(isGroupMember(alice, "g1")).toBe(true);
    expect(isGroupMember(alice, "g2")).toBe(false);
    expect(isAdmin(alice)).toBe(true);
  });

  test("the payer can delete their own expense", () => {
    const bob = { id: "m2", groupId: "g1", name: "Bob", role: "member" as const };
    const expense = { groupId: "g1", payerId: "m2" };
    expect(canDeleteExpense(bob, expense)).toBe(true);
  });

  test("a member of a different group cannot delete the expense", () => {
    const stranger = { id: "m3", groupId: "g2", name: "Carol", role: "member" as const };
    const expense = { groupId: "g1", payerId: "m2" };
    expect(canDeleteExpense(stranger, expense)).toBe(false);
  });
});
