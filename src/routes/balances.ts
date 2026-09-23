import { Hono } from "hono";
import type { Database } from "bun:sqlite";
import { requireAuth, requireGroupMember, type AuthEnv } from "../auth/middleware.ts";
import { computeBalances, settleUp } from "../balances.ts";

export function balancesRoutes(db: Database) {
  const app = new Hono<AuthEnv>();

  app.get("/groups/:groupId/balances", requireAuth(db), requireGroupMember(), (c) => {
    const groupId = c.req.param("groupId");
    const balances = computeBalances(db, groupId);
    const transfers = settleUp(balances);
    return c.json({ balances, transfers });
  });

  return app;
}
