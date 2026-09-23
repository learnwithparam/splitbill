---
title: "Upgrade hono 3.12.12 to 4.x"
labels: [dependency]
---

<!-- factory:scan id=audit:hono -->

## Package

hono

## Current -> target version

3.12.12 -> latest 4.x (check `bun outdated` for the exact current latest)

## Why now

We're pinned to a major version behind. `bun outdated` flags it, and
staying current keeps us on a supported release line for future
advisories.

## Known breaking change in this repo

`src/routes/groups.ts` uses hono 3.x's `HonoRequest.cookie()` and
`Context.cookie()` to read/set a `sb_last_group` cookie. Both are removed
in v4 - the v4 migration guide replaces them with `getCookie`/`setCookie`
from `hono/cookie`. There may be others; read the changelog from 3.12.12
to the target version, not just the target's own release notes.

## Notes for whoever picks this up

See `.claude/skills/upgrading-a-dependency`. One package at a time -
don't bundle this with the nanoid bump (issue #7). This is a major-version
bump, so per `.factory/charter.md` it's high risk and waits for
`/factory approve` even though it doesn't touch a protected path.
