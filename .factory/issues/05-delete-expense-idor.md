---
title: "Any group member can delete any other member's expense"
labels: [security]
---

## What happened

`DELETE /api/groups/:groupId/expenses/:expenseId` only checks that the
caller is *a* member of the expense's group. It does not check that the
caller is the expense's payer, or a group admin. Any member can delete any
other member's expense.

## Steps to reproduce

Using Ben's token (not the payer, not an admin), delete an expense that
Asha (an admin, but not this expense's payer either - any non-payer,
non-admin member works) paid for:

```
curl -s -X DELETE http://localhost:3200/api/groups/goa-trip/expenses/<some-expense-id-paid-by-someone-else> \
  -H "Authorization: Bearer goa-ben"
```

## Expected

`403 Forbidden` - Ben is neither the payer nor an admin.

## Actual

`204 No Content` - the expense is deleted.

## Area

auth

## Severity

high

## Note: this touches a protected path

`src/auth/**` is protected per `.factory/charter.md`. Per the charter, a
plan that requires editing it is refused at triage, not built by an agent.
This issue is expected to be refused into `factory:needs-human` with the
charter rule quoted, and fixed by a human PR (or an agent PR reviewed by
`@learnwithparam` as CODEOWNER, if the process is later changed to allow
that).

The bug is in `src/auth/permissions.ts`'s `canDeleteExpense`: it checks
`member.groupId === expense.groupId` but never checks
`member.id === expense.payerId || member.role === "admin"`.
