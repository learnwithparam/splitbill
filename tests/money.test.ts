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

  test("gives the leftover cent to the first member when splitting 1000 three ways", () => {
    const shares = splitCents(1000, ["a", "b", "c"]);
    expect(shares).toEqual({ a: 334, b: 333, c: 333 });
    expect(sumCents(Object.values(shares))).toBe(1000);
  });

  test("assigns leftover cents so the shares sum to the total", () => {
    const shares = splitCents(101, ["a", "b", "c", "d", "e"]);
    expect(shares).toEqual({ a: 21, b: 20, c: 20, d: 20, e: 20 });
    expect(sumCents(Object.values(shares))).toBe(101);
  });

  test("gives leftover cents to the first members in member order", () => {
    const shares = splitCents(1002, ["c", "a", "d", "b"]);
    expect(shares).toEqual({ c: 251, a: 251, d: 250, b: 250 });
    expect(sumCents(Object.values(shares))).toBe(1002);
  });

  test("splits a total smaller than the member count one cent at a time", () => {
    const shares = splitCents(2, ["a", "b", "c", "d", "e"]);
    expect(shares).toEqual({ a: 1, b: 1, c: 0, d: 0, e: 0 });
    expect(sumCents(Object.values(shares))).toBe(2);
  });
});
