import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { initSchema } from "../src/db.ts";
import { seedDemoData } from "../src/seed.ts";
import { createApp } from "../src/server.ts";

function setupApp() {
  const db = new Database(":memory:");
  initSchema(db);
  seedDemoData(db);
  return createApp(db);
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function asJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

interface GroupsListBody {
  groups: { id: string; name: string }[];
}
interface GroupDetailBody {
  group: { id: string; name: string };
  members: { id: string; name: string }[];
  balances: { memberId: string; netCents: number }[];
}
interface ExpensesListBody {
  expenses: { id: string; description: string }[];
}
interface CreateExpenseBody {
  expense: { id: string };
}

describe("GET /api/groups", () => {
  test("lists both demo groups without auth", async () => {
    const app = setupApp();
    const res = await app.request("/api/groups");
    expect(res.status).toBe(200);
    const body = await asJson<GroupsListBody>(res);
    expect(body.groups.map((g) => g.id).sort()).toEqual(["flat-4b", "goa-trip"]);
  });
});

describe("GET /api/groups/:id", () => {
  test("rejects a missing token", async () => {
    const app = setupApp();
    const res = await app.request("/api/groups/goa-trip");
    expect(res.status).toBe(401);
  });

  test("rejects a token from a different group with 404, not 403", async () => {
    const app = setupApp();
    const res = await app.request("/api/groups/flat-4b", { headers: auth("goa-asha") });
    expect(res.status).toBe(404);
  });

  test("returns group, members, and balances for a valid member token", async () => {
    const app = setupApp();
    const res = await app.request("/api/groups/goa-trip", { headers: auth("goa-asha") });
    expect(res.status).toBe(200);
    const body = await asJson<GroupDetailBody>(res);
    expect(body.group.name).toBe("Goa trip");
    expect(body.members.length).toBe(4);
    expect(body.balances.length).toBe(4);
  });
});

describe("GET /api/groups/:id/expenses", () => {
  test("paginates with a default page smaller than the fixture (exceeds one page)", async () => {
    const app = setupApp();
    const first = await app.request("/api/groups/goa-trip/expenses", { headers: auth("goa-asha") });
    const firstBody = await asJson<ExpensesListBody>(first);
    expect(firstBody.expenses.length).toBe(20);

    const lastExpense = firstBody.expenses[firstBody.expenses.length - 1]!;
    const second = await app.request(`/api/groups/goa-trip/expenses?cursor=${lastExpense.id}`, { headers: auth("goa-asha") });
    const secondBody = await asJson<ExpensesListBody>(second);
    expect(secondBody.expenses.length).toBe(5);
  });

  test("search returns only matching expenses", async () => {
    const app = setupApp();
    const res = await app.request("/api/groups/goa-trip/expenses?q=Fuel", { headers: auth("goa-asha") });
    const body = await asJson<ExpensesListBody>(res);
    expect(body.expenses.length).toBe(1);
    expect(body.expenses[0]?.description).toBe("Fuel");
  });
});

describe("POST and DELETE /api/groups/:id/expenses", () => {
  test("creates an expense and the payer can delete it", async () => {
    const app = setupApp();
    const createRes = await app.request("/api/groups/goa-trip/expenses", {
      method: "POST",
      headers: { ...auth("goa-ben"), "Content-Type": "application/json" },
      body: JSON.stringify({
        payerId: "goa-ben-id",
        amountCents: 500,
        description: "Test snack",
        splitAmong: ["goa-ben-id", "goa-asha-id"],
      }),
    });
    expect(createRes.status).toBe(201);
    const { expense } = await asJson<CreateExpenseBody>(createRes);

    const deleteRes = await app.request(`/api/groups/goa-trip/expenses/${expense.id}`, {
      method: "DELETE",
      headers: auth("goa-ben"),
    });
    expect(deleteRes.status).toBe(204);
  });
});

describe("GET /api/groups/:id/balances", () => {
  test("transfers settle every balance to zero net", async () => {
    // Flat 4B's seeded amounts all divide evenly by its 3 members, so this
    // fixture is unaffected by the splitCents remainder bug (issue #2) and
    // exercises settle-up on its own.
    const app = setupApp();
    const res = await app.request("/api/groups/flat-4b/balances", { headers: auth("flat-priya") });
    const body = (await res.json()) as { balances: { netCents: number }[]; transfers: unknown[] };
    const totalNet = body.balances.reduce((sum, b) => sum + b.netCents, 0);
    expect(totalNet).toBe(0);
    expect(body.transfers.length).toBeGreaterThan(0);
  });
});

describe("GET /api/groups/:id/export.csv", () => {
  test("returns a header row plus one row per expense", async () => {
    const app = setupApp();
    const res = await app.request("/api/groups/flat-4b/export.csv", { headers: auth("flat-priya") });
    expect(res.status).toBe(200);
    const text = await res.text();
    const lines = text.trim().split("\n");
    expect(lines[0]).toBe("date,payer,description,amount");
    expect(lines.length).toBe(4); // header + 3 seeded Flat 4B expenses
  });
});
