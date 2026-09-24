import { describe, expect, test } from "bun:test";
import { formatCents, parseCents, splitCents, sumCents } from "../src/money/cents.ts";

describe("formatCents", () => {
  test("formats whole and fractional cents", () => {
    expect(formatCents(1000)).toBe("10.00");
    expect(formatCents(1005)).toBe("10.05");
    expect(formatCents(5)).toBe("0.05");
  });

  test("formats negative cents with a leading minus", () => {
    expect(formatCents(-250)).toBe("-2.50");
  });
});

describe("parseCents", () => {
  test("parses decimal strings into integer cents", () => {
    expect(parseCents("10.00")).toBe(1000);
    expect(parseCents("10.5")).toBe(1050);
    expect(parseCents("3")).toBe(300);
  });

  test("throws on invalid input", () => {
    expect(() => parseCents("abc")).toThrow();
  });
});

describe("splitCents", () => {
  test("splits an amount evenly among members", () => {
    const shares = splitCents(900, ["a", "b", "c"]);
    expect(shares).toEqual({ a: 300, b: 300, c: 300 });
    expect(sumCents(Object.values(shares))).toBe(900);
  });

  test("splits an amount evenly between two members", () => {
    const shares = splitCents(2000, ["a", "b"]);
    expect(sumCents(Object.values(shares))).toBe(2000);
  });

  test("gives the remainder cents to the first members", () => {
    expect(splitCents(1000, ["a", "b", "c"])).toEqual({ a: 334, b: 333, c: 333 });
  });

  test("shares always sum to the total", () => {
    const cases: Array<[number, number]> = [
      [1000, 3],
      [101, 5],
      [1, 3],
      [2, 3],
      [999, 7],
      [1003, 4],
    ];
    for (const [total, n] of cases) {
      const ids = Array.from({ length: n }, (_, i) => `m${i}`);
      const shares = splitCents(total, ids);
      expect(sumCents(Object.values(shares))).toBe(total);
      const base = Math.floor(total / n);
      const remainder = total - base * n;
      ids.forEach((id, i) => {
        expect(shares[id]).toBe(i < remainder ? base + 1 : base);
      });
    }
  });
});
