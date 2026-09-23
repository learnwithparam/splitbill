---
title: "Expense search leaks other groups' expenses"
labels: [security]
---

## What happened

The expense search endpoint (`GET /api/groups/:groupId/expenses?q=...`)
builds its SQL query by splicing the `q` parameter directly into a `LIKE`
clause instead of binding it as a parameter. A crafted `q` breaks out of
the clause and can read expenses that belong to a completely different
group than the one in the URL and the caller's token.

## Steps to reproduce

Using a Goa trip member's token, search Goa trip's own expenses with a
crafted query:

```
curl -s "http://localhost:3200/api/groups/goa-trip/expenses?q=%27%20OR%201%3D1%20--" \
  -H "Authorization: Bearer goa-asha"
```

(`q` is `' OR 1=1 --`.)

## Expected

Only Goa trip's own expenses (matching the search term, or none) come
back.

## Actual

The response includes Flat 4B's expenses too - a group `goa-asha` is not a
member of and has no token for.

## Area

search

## Severity

high

## Notes for whoever picks this up

See `.claude/skills/fixing-a-vulnerability`: write the exploit above as a
failing test first (assert the response does NOT contain a Flat 4B
expense), then fix `src/expenses.ts`'s `listExpenses` to bind `query` as a
`?` parameter instead of splicing it into the SQL string.
