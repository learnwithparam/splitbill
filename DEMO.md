# Factory demo runbook

Shows every way a human steers the factory, using this repo's seeded issues. Issue numbers change on
every reset, so the runbook names issues by title.

## Setup

Setup changes (config, charter, skills, CI) and demo output are handled differently by `reset`, which
force-pushes `main` back to the `baseline` tag and drops anything merged after it:

1. Merge any setup PR into `main`.
2. `bin/factory rebaseline --repo-dir ../splitbill` moves the tag onto the new `main`, keeping the setup.
3. `bin/factory reset --repo-dir ../splitbill --dry-run`, then without `--dry-run`. The dry-run lists every
   `drop-commit`; that list should be empty.

```bash
cd ../factory
bin/factory doctor --repo-dir ../splitbill --fix
make up REPO_DIR=../splitbill          # runner + dashboard on http://localhost:4100
```

The runner polls every 15 seconds. All human input is GitHub state: a label, an issue comment, a PR
comment or review, or a dashboard button (which posts the same comment). Only OWNER, MEMBER and
COLLABORATOR count. A PR is a draft while the factory works and is marked ready for review when it hands
over to you.

## Live sequence

| Step | Issue (by title) | Human action, and where | What you see |
|---|---|---|---|
| 1 | "Splitting $10.00 three ways loses a cent", "CSV export shows raw cents" | add label `factory:ready` on the issue | low risk plans auto-approve, build, and a PR opens, marked ready for review |
| 2 | "README has no run steps" | on its PR, comment `/factory revise <what to change>` | the PR goes back to draft, gets a new commit, and is marked ready again; no second PR |
| 3 | "Expense search leaks other groups' expenses" | comment `/factory revise <text>` on the issue at `awaiting-approval`, then `/factory approve` | plan revision 2, then build |
| 4 | "Upgrade hono 3.12.12 to 4.x" | high risk plan: comment `/factory cancel` | issue closed, worktree removed |
| 5 | "Any group member can delete any other member's expense" | none: it needs a protected path | refused at triage, nothing built |
| 6 | "Make settling up easier" | the agent asks a question: answer in the dashboard, or as a plain issue comment | resumes at the stage that asked |
| 7 | none | `bin/factory scan --repo-dir ../splitbill` | files the nanoid advisory as an issue |

## Paths you cannot force live

Timeouts, verify rejects, red gates, boundary hits, denied tools, a lost claim and crash recovery are
replayed offline, one named test each:

```bash
cd ../factory && bun test tests/scenarios.test.ts
```

A structural test in that file fails if any state label has no scenario, so a new state cannot ship
untested.

## Deliver and reset

`main` requires a code-owner approval and the runner posts as you, so you cannot approve a factory PR
yourself. Merge one with an admin bypass (`gh pr merge <n> --squash --admin`), then run
`bin/factory reset --repo-dir ../splitbill`: the dry-run lists that merge as a `drop-commit`, and the real
reset puts `main` back on the baseline. The factory never merges.
