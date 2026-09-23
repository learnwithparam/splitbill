---
title: "Splitting $10.00 three ways loses a cent"
labels: [bug]
---

## What happened

Add an expense of 1000 cents ($10.00) split among 3 people. The three
shares are 333, 333, 333 cents - they sum to 999, not 1000. A cent
disappears.

## Expected

Shares should always sum to exactly the original amount. One (or more)
member should get the leftover cent(s), e.g. 334, 333, 333.

## Steps to reproduce

```
bun run .claude/skills/handling-money/scripts/check-cents.ts
```

The `split(1000, 3 members)` case prints `FAIL ... sum 999 (expected 1000)`.

Or via the API, with any Goa trip token:

```
curl -s -X POST http://localhost:3200/api/groups/goa-trip/expenses \
  -H "Authorization: Bearer goa-asha" -H "Content-Type: application/json" \
  -d '{"payerId":"goa-asha-id","amountCents":1000,"description":"test","splitAmong":["goa-asha-id","goa-ben-id","goa-chetan-id"]}'
```

Then check the expense's shares sum to 1000 - they sum to 999.

## Area

money

## Severity

medium

## Notes for whoever picks this up

See `.claude/skills/handling-money` - the remainder rule is documented in
`references/rules.md`. The fix is in `src/money/cents.ts`'s `splitCents`.
