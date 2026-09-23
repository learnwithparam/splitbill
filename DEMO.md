# Factory demo runbook

Shows every way a human steers the factory, using this repo. Run `factory reset` first (it force-pushes
`main` back to the `baseline` tag; use `--dry-run` before the first time).

## Setup

```bash
cd ../factory
bin/factory doctor --repo-dir ../splitbill --fix
make up REPO_DIR=../splitbill          # runner + dashboard on http://localhost:4100
```

The runner polls every 15 seconds. All human input is GitHub state: a label, an issue comment, a draft
PR comment or review, or a dashboard button (which posts the same comment). Only OWNER, MEMBER and
COLLABORATOR count.

## Live sequence

| Step | Issue | Human action, and where | What you see |
|---|---|---|---|
| 1 | #16, #17 | add label `factory:ready` on the issue | low risk plans auto-approve, build, and a draft PR opens |
| 2 | #15 | on the draft PR, comment `/factory revise <what to change>` | the same PR gets a new commit, no second PR |
| 3 | #18 | comment `/factory revise <text>` on the issue at `awaiting-approval`, then `/factory approve` | plan revision 2, then build |
| 4 | #20 | high risk plan: comment `/factory cancel` | issue closed, worktree removed |
| 5 | #19 | none: it needs a protected path | refused at triage, nothing built |
| 6 | #21 | the agent asks a question: answer in the dashboard, or as a plain issue comment | resumes at the stage that asked |
| 7 | none | `bin/factory scan --repo-dir ../splitbill` | files the nanoid advisory as an issue |

## Paths you cannot force live

Timeouts, verify rejects, red gates, boundary hits, denied tools, a lost claim and crash recovery are
replayed offline, one named test each:

```bash
cd ../factory && bun test tests/scenarios.test.ts
```

A structural test in that file fails if any state label has no scenario, so a new state cannot ship
untested.

## After the demo

Merge or close the draft PRs yourself; the factory never merges.
