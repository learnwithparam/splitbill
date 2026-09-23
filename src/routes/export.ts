import { Hono } from "hono";
import type { Database } from "bun:sqlite";
import { requireAuth, requireGroupMember, type AuthEnv } from "../auth/middleware.ts";
import { exportCsv } from "../csv.ts";

export function exportRoutes(db: Database) {
  const app = new Hono<AuthEnv>();

  app.get("/groups/:groupId/export.csv", requireAuth(db), requireGroupMember(), (c) => {
    const groupId = c.req.param("groupId");
    const csv = exportCsv(db, groupId);
    c.header("Content-Type", "text/csv");
    return c.body(csv);
  });

  return app;
}
