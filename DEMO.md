# Factory demo runbook

Shows every way a human steers the factory, using this repo's seeded issues. Issue numbers change on
every reset, so the runbook names issues by title.

## Setup

Never reset this repo. Its `main` is protected and holds the real fix. Demos run in your own copy, a
private `splitbill-demo` repo in your account, so a reset only touches that copy. Make it once:

```bash
gh repo create <you>/splitbill-demo --private
git clone git@github.com:learnwithparam/splitbill.git splitbill-demo && cd splitbill-demo
git checkout demo                      # main without the cent-split fix, so the bug is there to find
git remote set-url origin git@github.com:<you>/splitbill-demo.git
git push origin demo:main && git tag baseline && git push origin baseline
git checkout -B main origin/main
```

The `demo` branch leaves `repo` out of `.factory/config.json`, so the factory reads it from your origin. Each
person's issues, PRs and labels live in their own copy, so two people never collide. Keep the copy
unprotected, because a reset force-pushes its `main` back to `baseline`.

Reset it with `bin/factory reset --repo-dir ../splitbill-demo-demo --dry-run`, then without `--dry-run`. It closes
only issues labelled `factory:*` or seeded from `.factory/issues`; add `--all-issues` to close the rest.

```bash
cd ../factory
bin/factory doctor --repo-dir ../splitbill-demo --fix
make up REPO_DIR=../splitbill-demo          # runner + dashboard on http://localhost:4100
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
| 7 | none | `bin/factory scan --repo-dir ../splitbill-demo` | files the nanoid advisory as an issue |

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
`bin/factory reset --repo-dir ../splitbill-demo`: the dry-run lists that merge as a `drop-commit`, and the real
reset puts `main` back on the baseline. The factory never merges.

## By release

Each section names one thing to show for that factory release. Run them from `../factory`.

### v2.3: the boundary tells the truth

Label "README has no run steps" `factory:ready`, then comment `/factory cancel` while it waits for plan approval.
The issue closes, the PR (if any) closes, and the worktree is gone. Then `bin/factory doctor --repo-dir ../splitbill-demo --json`
shows every check and exits 4 if one fails.

### v2.4: the cockpit

`bin/factory inbox --repo-dir ../splitbill-demo` lists what waits on you. Acting from the dashboard Inbox or with
`bin/factory inbox 12 approve` posts the same `/factory approve` comment you would type. `bin/factory logs 12 --follow`
tails the run.

### v2.5: any agent, counted honestly

Run the cent-split issue and open Analytics: each stage shows its agent, tokens and cost. A stage whose agent reports no
usage shows "Not reported", never $0.00. Read-only stages (triage, plan, verify) cannot write files.

### v2.6: one factory, any agent

Open the Agents page: each preset, its pinned version, the installed version and its doctor rows. Add a second agent under
`agents` in `.factory/config.json` and point `stages.verify` at it. `bin/factory install --update` (or `install.sh --agents`)
links the skills into that agent's own directory.

### v2.6.1: presets that work on first use

`bin/factory verify-agent <name> --repo-dir ../splitbill-demo --issue <N>` runs one issue on that agent and records a fixture.
Only Claude is verified by the maintainers; the rest say "Verified by participants: not yet" until someone does.
