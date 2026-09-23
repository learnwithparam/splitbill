import type { Database } from "bun:sqlite";
import type { Context, MiddlewareHandler } from "hono";
import { findMemberByToken } from "./tokens.ts";
import type { AuthedMember } from "../types.ts";

export interface AuthEnv {
  Variables: {
    member: AuthedMember;
  };
}

/** Require a valid `Authorization: Bearer <token>` header; 401 otherwise. */
export function requireAuth(db: Database): MiddlewareHandler<AuthEnv> {
  return async (c: Context<AuthEnv>, next) => {
    const header = c.req.header("Authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    if (!token) {
      return c.json({ error: { code: "unauthorized", message: "missing bearer token" } }, 401);
    }
    const member = findMemberByToken(db, token);
    if (!member) {
      return c.json({ error: { code: "unauthorized", message: "invalid token" } }, 401);
    }
    c.set("member", member);
    await next();
  };
}

/**
 * Require the authenticated member to belong to the :groupId route param.
 * Cross-tenant access returns 404, never 403, so a caller cannot tell a
 * group they are not in even exists.
 */
export function requireGroupMember(): MiddlewareHandler<AuthEnv> {
  return async (c: Context<AuthEnv>, next) => {
    const groupId = c.req.param("groupId");
    const member = c.get("member");
    if (member.groupId !== groupId) {
      return c.json({ error: { code: "not_found", message: "group not found" } }, 404);
    }
    await next();
  };
}
