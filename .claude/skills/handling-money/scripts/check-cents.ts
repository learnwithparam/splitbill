#!/usr/bin/env bun
// Runnable sum-invariant check for split logic: asserts that shares always
// sum to the original total, for both even and uneven splits. Run with:
//   bun run .claude/skills/handling-money/scripts/check-cents.ts
// This is a skill script (not part of `make check`); it's the tool an
// agent runs while applying the handling-money skill.

import { splitCents, sumCents } from "../../../../src/money/cents.ts";

const cases: { totalCents: number; members: string[] }[] = [
  { totalCents: 900, members: ["a", "b", "c"] }, // divides evenly
  { totalCents: 2000, members: ["a", "b"] }, // divides evenly
  { totalCents: 1000, members: ["a", "b", "c"] }, // does NOT divide evenly
  { totalCents: 101, members: ["a", "b", "c", "d", "e"] }, // does NOT divide evenly
];

let failures = 0;

for (const { totalCents, members } of cases) {
  const shares = splitCents(totalCents, members);
  const total = sumCents(Object.values(shares));
  const ok = total === totalCents;
  const status = ok ? "ok " : "FAIL";
  console.log(`[${status}] split(${totalCents}, ${members.length} members) -> sum ${total} (expected ${totalCents})`);
  if (!ok) failures++;
}

if (failures > 0) {
  console.error(`\n${failures} case(s) lost cents. See references/rules.md for the remainder rule.`);
  process.exit(1);
}
console.log("\nall splits sum to their total.");
