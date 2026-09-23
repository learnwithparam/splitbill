#!/usr/bin/env bun
import { openDb } from "./db.ts";
import { seedDemoData } from "./seed.ts";
import { computeBalances, settleUp } from "./balances.ts";
import { exportCsv } from "./csv.ts";
import { formatCents } from "./money/cents.ts";
import type { Group } from "./types.ts";

function usage(): string {
  return [
    "splitbill - a tiny expense splitter",
    "",
    "Usage:",
    "  splitbill groups                 list all groups",
    "  splitbill balances <group-id>    show each member's balance and settle-up transfers",
    "  splitbill export <group-id>      print the group's expenses as CSV",
    "",
    "Example:",
    "  splitbill groups",
    "  splitbill balances goa-trip",
  ].join("\n");
}

export function run(argv: string[], db: ReturnType<typeof openDb>): string {
  const [command, arg] = argv;

  if (command === "groups") {
    const rows = db.query("SELECT id, name FROM groups").all() as Group[];
    if (rows.length === 0) return "(no groups)";
    return rows.map((g) => `${g.id}\t${g.name}`).join("\n");
  }

  if (command === "balances") {
    if (!arg) return "splitbill balances <group-id>: missing group id";
    const balances = computeBalances(db, arg);
    if (balances.length === 0) return `no such group: ${arg}`;
    const lines = balances.map((b) => `${b.name}\t${b.netCents >= 0 ? "+" : ""}${formatCents(b.netCents)}`);
    const transfers = settleUp(balances);
    lines.push("", "Settle up:");
    if (transfers.length === 0) {
      lines.push("  everyone is settled up");
    } else {
      const byId = new Map(balances.map((b) => [b.memberId, b.name]));
      for (const t of transfers) {
        lines.push(`  ${byId.get(t.fromMemberId)} pays ${byId.get(t.toMemberId)} ${formatCents(t.amountCents)}`);
      }
    }
    return lines.join("\n");
  }

  if (command === "export") {
    if (!arg) return "splitbill export <group-id>: missing group id";
    return exportCsv(db, arg).trimEnd();
  }

  return usage();
}

if (import.meta.main) {
  const db = openDb(process.env.SPLITBILL_DB ?? "splitbill.sqlite");
  seedDemoData(db);
  console.log(run(process.argv.slice(2), db));
}
