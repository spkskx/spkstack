# spkstack

My personal AI stack for building software with Claude Code. It starts small and grows only when a real project needs a new step.

Inspired by [pstack](https://github.com/cursor/plugins/tree/main/pstack) and [gstack](https://github.com/garrytan/gstack).

## The loop

```
idea  --/spkstack:idea-to-tickets-->  GitHub issues (epic + tickets)  --/spkstack:ticket-to-pr-->  pull request
                                                                      --/spkstack:next---------->  one PR per ready ticket
pull request  --/spkstack:review-->  one comment: each acceptance criterion met, not met, or unclear
```

| Skill | What it does |
|---|---|
| [`/spkstack:idea-to-tickets`](skills/idea-to-tickets/SKILL.md) | Asks a few forcing questions, agrees an MVP cut, then files GitHub issues only: an epic whose body is the spec, and ordered, labeled tickets. Optionally adds them to a GitHub Project or milestone. |
| [`/spkstack:ticket-to-pr`](skills/ticket-to-pr/SKILL.md) | Picks the top eligible issue (or the one you name), plans, implements, runs the repo's checks, and opens a PR that closes it. |
| [`/spkstack:next`](skills/next/SKILL.md) | Runs ticket-to-pr on every ticket of an epic that can start now, one at a time, after one approval, and posts the pass report on the epic. Never merges: merge the PRs, then run it again for the tickets that depended on them. |
| [`/spkstack:review`](skills/review/SKILL.md) | Checks a PR against the acceptance criteria of the ticket it closes and flags work outside its scope, then posts one review comment. Never approves or merges. For bugs, use `/code-review`. |
| [`/spkstack:help`](skills/help/SKILL.md) | Says which skill fits a task and the exact command to type, from the skills actually installed. Points to `/code-review`, `/ship`, or `/steward` when those fit better. |

The skills agree on one format: [`docs/ticket-contract.md`](docs/ticket-contract.md) (labels, issue body, sizing, eligibility, unattended runs, and the epic that holds the spec).

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
/spkstack:help I have an app idea
```

## Roadmap

Not built yet. Each gets added when a real project hits the need.

- `/spkstack:ship`: drive a PR to merge-ready (CI, review threads, conflicts).
- `/spkstack:retro`: turn lessons from a run into edits to these skills.

## Contributing to it

See [CLAUDE.md](CLAUDE.md) for how skills are written here.
