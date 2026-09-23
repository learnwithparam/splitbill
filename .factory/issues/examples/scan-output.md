---
title: "[TEMPLATE - not seeded] nanoid: predictable results with non-integer values"
labels: [security, dependency, factory:monitor]
---

<!--
This file is a TEMPLATE, not a seeded backlog item. Per the plan
(software-factory v2, section 8), issue #7 is not pre-created by reset -
`factory scan` (bun audit) is meant to file it live, during the demo, to
show "production signal becomes a task". This file shows the runner's
scan.ts what that filed issue should look like, and gives the class a
fallback description before the live scan runs.
-->

## Source

`factory scan` (`bun audit`), not a human report.

## Advisory

`GHSA-mwcw-c2x4-8c55` - "Predictable results in nanoid generation when
given non-integer values". Affects `nanoid < 3.3.8`; we're pinned to
`3.3.7` in `package.json`, used in `src/auth/tokens.ts` for token
generation.

## Reproduce the finding

```
bun audit
```

Output includes:

```
nanoid  <3.3.8
  (direct dependency)
  moderate: Predictable results in nanoid generation when given non-integer values - https://github.com/advisories/GHSA-mwcw-c2x4-8c55
```

## Expected fix

Bump `nanoid` to a patched 3.x release (3.3.8 or later - stay within major
3, no API changes needed) in `package.json`, run `bun install`, confirm
`bun audit` no longer lists `GHSA-mwcw-c2x4-8c55`.

## Notes for whoever picks this up

See `.claude/skills/fixing-a-vulnerability` and
`.claude/skills/upgrading-a-dependency`. This is a patch-level bump with
no known call-site changes, so no exploit test is required - `bun audit`
going clean is the evidence. Don't bundle with the hono bump (issue #6).
