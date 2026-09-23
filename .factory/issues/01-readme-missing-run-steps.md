---
title: "README has no run steps or CLI example"
labels: [docs]
---

## Where

README.md

## What's missing or wrong

The README describes what splitbill is but never says how to actually run
it: no install step, no `bun run dev` command, no port number, and no
example of using the CLI (`splitbill groups`, `splitbill balances <group>`,
`splitbill export <group>`). A new contributor has to read `package.json`
and `src/cli.ts` to figure out how to start the app.

## Expected

A "Run it" section with:
- `bun install`
- `bun run dev` and the URL it serves (http://localhost:3200)
- One CLI example, e.g. `bun run src/cli.ts groups`

## Done when

The README has these steps and they work when followed on a clean clone.
