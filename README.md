# splitbill

A small expense splitter for a group trip or a shared flat: track who paid
for what, see each person's balance, and settle up with the fewest
transfers.

## What it does

- Groups of members, each with a share token.
- Expenses: a payer, an amount in cents, and who the cost is split among.
- Balances: what each member paid minus what they owe.
- Settle up: the minimal set of transfers that zeroes every balance.
- CSV export of a group's expenses.
- A CLI (`groups`, `balances <group>`, `export <group>`) alongside the web
  page and API.

## Run it

```sh
bun install
bun run dev        # serves http://localhost:3200
```

The first run creates `splitbill.sqlite` and seeds two demo groups
(`goa-trip`, `flat-4b`).

The CLI reads the same database:

```sh
bun run src/cli.ts groups
```

`bun run src/cli.ts balances <group>` and `bun run src/cli.ts export <group>`
are also available, e.g. `bun run src/cli.ts balances goa-trip`.

## Stack

Bun, TypeScript, Hono, `bun:sqlite`. No build step for the web page
(`public/index.html` is served as-is).

## Layout

```
src/money/      integer-cents math: split, format, parse
src/auth/       token lookup and permission checks (protected path)
src/db.ts       schema
src/*.ts        domain logic (expenses, balances, csv)
src/routes/     HTTP handlers
src/server.ts   Hono app + Bun.serve entrypoint
src/cli.ts      splitbill CLI
public/         the web page
tests/          bun:test suite
```

See `AGENTS.md` for conventions and what's protected.
