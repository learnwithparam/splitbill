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

Needs [Bun](https://bun.sh).

```sh
bun install
bun run dev    # serves http://localhost:3200
```

The first run creates `splitbill.sqlite` and seeds demo groups. Set `PORT` to use another port
and `SPLITBILL_DB` to use another database file.

The CLI reads the same database:

```sh
bun run src/cli.ts groups                 # list all groups
bun run src/cli.ts balances <group-id>    # e.g. bun run src/cli.ts balances goa-trip
bun run src/cli.ts export <group-id>      # the group's expenses as CSV
```

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

## Factory demos and checkpoints

`DEMO.md` explains how to run the factory against a disposable `splitbill-demo` copy. Never run it
against this repo. Each teaching session's starting state is the `checkpoint/<id>` tag in
`splitbill-demo` that `factory/teach/sessions.json` names. The `01-boundary` … `06-delivery`
branches and `checkpoint/0N-*` tags in this repo are legacy (they use the old lesson numbering) and
are kept only for anyone who already cloned them.
