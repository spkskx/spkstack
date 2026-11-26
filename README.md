# spkstack

My personal AI stack for building software with Claude Code. It starts small and grows only when a real project needs a new step.

Inspired by [pstack](https://github.com/cursor/plugins/tree/main/pstack) and [gstack](https://github.com/garrytan/gstack).

## The loop

```
idea  --/spkstack:idea-to-tickets-->  GitHub issues (epic + tickets)  --/spkstack:ticket-to-pr-->  pull request
                                                                      --/spkstack:next---------->  one PR per ready ticket
pull request  --/spkstack:review-->  one comment: each acceptance criterion met, not met, or unclear
epic's PRs    --/spkstack:ship---->  conflicts cleared, checks green, review threads answered
a run         --/spkstack:retro--->  lessons filed as tickets on spkstack itself
a repo        --/spkstack:setup--->  one PR: CLAUDE.md rules, formatter, linter, CI
```

| Skill | What it does |
|---|---|
| [`/spkstack:idea-to-tickets`](skills/idea-to-tickets/SKILL.md) | Grills you on the idea until every decision that shapes the tickets is made, agrees an MVP cut, then files GitHub issues only: an epic whose body is the spec, and ordered, labeled tickets. Optionally adds them to a GitHub Project or milestone. |
| [`/spkstack:ticket-to-pr`](skills/ticket-to-pr/SKILL.md) | Picks the top eligible issue (or the one you name), plans, implements, runs the repo's checks, and opens a PR that closes it. Grills you first when the ticket is ambiguous or has `needs-info` questions, and writes the answers back to the ticket. |
| [`/spkstack:next`](skills/next/SKILL.md) | Runs ticket-to-pr on every ticket of an epic that can start now, one at a time, after one approval, and posts the pass report on the epic. Never merges: merge the PRs, then run it again for the tickets that depended on them. |
| [`/spkstack:review`](skills/review/SKILL.md) | Checks a PR against the acceptance criteria of the ticket it closes, flags work outside its scope and tests that would pass with the behavior broken ([`docs/tautological-tests.md`](docs/tautological-tests.md)), then posts one review comment. Never approves or merges. For bugs, use `/code-review`. |
| [`/spkstack:ship`](skills/ship/SKILL.md) | One pass over an epic's open PRs after one approval: merges the base branch in to clear conflicts, fixes failing checks, answers review threads, and pushes to each PR's branch. Never merges or force-pushes. To watch one PR until it merges, use `/steward`. |
| [`/spkstack:retro`](skills/retro/SKILL.md) | Gathers lessons about the skills from a run (the session, the epic's pass reports, `needs-info` questions, PR comments), and after one approval files each as a ticket on the spkstack repo. Edits nothing itself. |
| [`/spkstack:setup`](skills/setup/SKILL.md) | Sets up a repo for deterministic AI development: writes a `## spkstack` section into its `CLAUDE.md` with the no-comments and no-tautological-tests rules, adds the language's formatter, strictest linter, and CI (JS/TS: oxlint, oxfmt, `tsc`, hollow-test lint rules, a lint check for comments outside the keep list, StrykerJS mutation testing on changed files; Go: gofmt, go vet, golangci-lint; Rust: rustfmt, clippy pedantic; Python: uv, ruff with all rules, Pyright strict; empty repos: a minimal TypeScript skeleton first), and opens one PR after one approval. Re-runnable. |
| [`/spkstack:no-comments`](skills/no-comments/SKILL.md) | Deletes comments outside the keep list in [`docs/no-comments.md`](docs/no-comments.md) from a diff, in a fresh subagent that did not write the code, and offers to turn "do not remove" style comments into a type, test, or lint. Never commits. |
| [`/spkstack:help`](skills/help/SKILL.md) | Says which skill fits a task and the exact command to type, from the skills actually installed. Points to `/code-review`, `/ship`, or `/steward` when those fit better. |

The skills agree on one format: [`docs/ticket-contract.md`](docs/ticket-contract.md) (labels, issue body, sizing, eligibility, unattended runs, and the epic that holds the spec). The rules `/spkstack:setup` writes into a repo are defined once in [`docs/no-comments.md`](docs/no-comments.md) and [`docs/tautological-tests.md`](docs/tautological-tests.md). When an idea or a ticket needs your decisions, they interview you the same way: [`docs/grilling.md`](docs/grilling.md), derived from Matt Pocock's [grilling skill](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling).

## Install

From GitHub:

```bash
/plugin marketplace add spkskx/spkstack
/plugin install spkstack@spkstack
```

From a local clone, while developing:

```bash
claude --plugin-dir /path/to/spkstack
```

All skills need `git` and the GitHub CLI (`gh auth login`).

## Usage

```
/spkstack:idea-to-tickets a habit tracker that pings me on Telegram when I skip a day
/spkstack:ticket-to-pr
/spkstack:ticket-to-pr 14
/spkstack:next
/spkstack:next 12
/spkstack:review 20
/spkstack:ship 12
/spkstack:retro 12
/spkstack:setup
/spkstack:no-comments
/spkstack:help I have an app idea
```

## Roadmap

Not built yet. Each gets added when a real project hits the need.

Nothing right now.

## Contributing to it

See [CLAUDE.md](CLAUDE.md) for how skills are written here.
