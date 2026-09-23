---
title: "CSV export shows raw cents instead of a formatted amount"
labels: [bug]
---

## What happened

The `amount` column in the CSV export (and the CLI's `export` command,
which shares the same code) prints the raw integer cents, e.g. `1000`,
instead of a formatted decimal amount like `10.00`.

## Expected

The amount column should read `10.00`, matching the money formatting
convention used everywhere else (the web page, the balances output).

## Steps to reproduce

```
curl -s http://localhost:3200/api/groups/flat-4b/export.csv -H "Authorization: Bearer flat-priya"
```

or

```
bun run src/cli.ts export flat-4b
```

Look at the `amount` column: values like `4500`, `1200`, `3000` instead of
`45.00`, `12.00`, `30.00`.

## Area

export

## Severity

low

## Notes for whoever picks this up

`src/csv.ts`'s `exportCsv` builds the row with `r.amountCents` directly.
It should use `formatCents` from `src/money/cents.ts` (see the
`handling-money` skill: "format only at the edge").
