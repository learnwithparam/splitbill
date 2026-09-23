import { Hono } from "hono";
import type { Database } from "bun:sqlite";
import { requireAuth, requireGroupMember, type AuthEnv } from "../auth/middleware.ts";
import { canDeleteExpense } from "../auth/permissions.ts";
import { createExpense, deleteExpense, findExpense, listExpenses } from "../expenses.ts";
import type { Member } from "../types.ts";

interface CreateExpenseBody {
  payerId?: string;
  amountCents?: number;
  description?: string;
  splitAmong?: string[];
}

export function expensesRoutes(db: Database) {
  const app = new Hono<AuthEnv>();

  app.get("/groups/:groupId/expenses", requireAuth(db), requireGroupMember(), (c) => {
    const groupId = c.req.param("groupId");
    const query = c.req.query("q") ?? undefined;
    const cursor = c.req.query("cursor") ?? undefined;
    const limitParam = c.req.query("limit");
    const limit = limitParam ? Number(limitParam) : undefined;
    const expenses = listExpenses(db, groupId, { query, cursor, limit });
    return c.json({ expenses });
  });

  app.post("/groups/:groupId/expenses", requireAuth(db), requireGroupMember(), async (c) => {
    const groupId = c.req.param("groupId");
    const body = (await c.req.json()) as CreateExpenseBody;
    if (!body.payerId || !body.amountCents || !body.description || !body.splitAmong?.length) {
      return c.json({ error: { code: "bad_request", message: "payerId, amountCents, description, splitAmong are required" } }, 400);
    }
    const payer = db
      .query("SELECT id FROM members WHERE id = ? AND group_id = ?")
      .get(body.payerId, groupId) as Member | null;
    if (!payer) {
      return c.json({ error: { code: "bad_request", message: "payerId is not a member of this group" } }, 400);
    }
    const expense = createExpense(db, {
      groupId,
      payerId: body.payerId,
      amountCents: body.amountCents,
      description: body.description,
      splitAmong: body.splitAmong,
    });
    return c.json({ expense }, 201);
  });

  app.delete("/groups/:groupId/expenses/:expenseId", requireAuth(db), requireGroupMember(), (c) => {
    const groupId = c.req.param("groupId");
    const expenseId = c.req.param("expenseId");
    const expense = findExpense(db, groupId, expenseId);
    if (!expense) return c.json({ error: { code: "not_found", message: "expense not found" } }, 404);
    const member = c.get("member");
    if (!canDeleteExpense(member, expense)) {
      return c.json({ error: { code: "forbidden", message: "you cannot delete this expense" } }, 403);
    }
    deleteExpense(db, expenseId);
    return c.body(null, 204);
  });

  return app;
}
