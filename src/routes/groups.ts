import { Hono } from "hono";
import type { Database } from "bun:sqlite";
import { requireAuth, requireGroupMember, type AuthEnv } from "../auth/middleware.ts";
import { computeBalances } from "../balances.ts";
import type { Group } from "../types.ts";

/**
 * Mounted at /api. Uses hono 3.x's `Context.cookie()` / `HonoRequest.cookie()`
 * helpers to remember the last group a caller viewed. These methods were
 * removed in hono v4 in favor of `hono/cookie`'s `getCookie`/`setCookie`
 * (issue #6: upgrading hono 3.12.12 -> 4.x is a real breaking change here).
 */
export function groupsRoutes(db: Database) {
  const app = new Hono<AuthEnv>();

  app.get("/groups", (c) => {
    const rows = db.query("SELECT id, name FROM groups").all() as Group[];
    return c.json({ groups: rows });
  });

  app.get("/last-group", requireAuth(db), (c) => {
    const lastGroup = c.req.cookie("sb_last_group") ?? null;
    return c.json({ lastGroup });
  });

  app.get("/groups/:groupId", requireAuth(db), requireGroupMember(), (c) => {
    const groupId = c.req.param("groupId");
    const group = db.query("SELECT id, name FROM groups WHERE id = ?").get(groupId) as Group | null;
    if (!group) return c.json({ error: { code: "not_found", message: "group not found" } }, 404);
    const members = db
      .query("SELECT id, name, role FROM members WHERE group_id = ?")
      .all(groupId);
    const balances = computeBalances(db, groupId);
    c.cookie("sb_last_group", groupId, { httpOnly: true, path: "/" });
    return c.json({ group, members, balances });
  });

  return app;
}
