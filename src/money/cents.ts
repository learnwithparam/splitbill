// All money in splitbill is an integer number of cents. Never use floats for
// amounts: see .claude/skills/handling-money/references/rules.md.

/** Format integer cents as a fixed 2-decimal string, e.g. 1005 -> "10.05". */
export function formatCents(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`formatCents expects an integer number of cents, got ${cents}`);
  }
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}${whole}.${frac}`;
}

/** Parse a decimal amount string ("10.05") into integer cents (1005). */
export function parseCents(input: string): number {
  const trimmed = input.trim();
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) {
    throw new Error(`invalid amount: ${input}`);
  }
  const [, sign, whole, frac = ""] = match;
  const paddedFrac = frac.padEnd(2, "0");
  const cents = Number(whole) * 100 + Number(paddedFrac);
  return sign === "-" ? -cents : cents;
}

/**
 * Split an integer amount of cents evenly across member ids.
 *
 * Remainder rule (.claude/skills/handling-money/references/rules.md): every
 * member gets floor(totalCents / n), and the first `remainder` members, in
 * the order passed in, get one extra cent, so the shares always sum to
 * exactly totalCents.
 */
export function splitCents(totalCents: number, memberIds: string[]): Record<string, number> {
  if (memberIds.length === 0) {
    throw new Error("cannot split among zero members");
  }
  const base = Math.floor(totalCents / memberIds.length);
  const remainder = totalCents - base * memberIds.length;
  const shares: Record<string, number> = {};
  memberIds.forEach((id, i) => {
    shares[id] = i < remainder ? base + 1 : base;
  });
  return shares;
}

export function sumCents(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
