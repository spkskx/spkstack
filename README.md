# spkstack

My personal AI stack for building software with Claude Code. It starts small and grows only when a real project needs a new step.

Inspired by [pstack](https://github.com/cursor/plugins/tree/main/pstack) and [gstack](https://github.com/garrytan/gstack).

## The loop

```
idea  --/spkstack:idea-to-tickets-->  GitHub issues (epic + tickets)  --/spkstack:ticket-to-pr-->  pull request
```

| Skill | What it does |
|---|---|
| [`/spkstack:idea-to-tickets`](skills/idea-to-tickets/SKILL.md) | Asks a few forcing questions, agrees an MVP cut, then files GitHub issues only: an epic whose body is the spec, and ordered, labeled tickets. Optionally adds them to a GitHub Project or milestone. |
| [`/spkstack:ticket-to-pr`](skills/ticket-to-pr/SKILL.md) | Picks the top eligible issue (or the one you name), plans, implements, runs the repo's checks, and opens a PR that closes it. |

The two skills agree on one format: [`docs/ticket-contract.md`](docs/ticket-contract.md) (labels, issue body, sizing, and the epic that holds the spec).

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

Both skills need `git` and the GitHub CLI (`gh auth login`).

## Usage

```
/spkstack:idea-to-tickets a habit tracker that pings me on Telegram when I skip a day
/spkstack:ticket-to-pr
/spkstack:ticket-to-pr 14
```

## Roadmap

Not built yet. Each gets added when a real project hits the need.

- `/spkstack:review`: review a PR against its ticket's acceptance criteria.
- `/spkstack:ship`: drive a PR to merge-ready (CI, review threads, conflicts).
- `/spkstack:next`: loop ticket-to-pr over an epic until it is done.
- `/spkstack:retro`: turn lessons from a run into edits to these skills.
- `/spkstack:help`: which skill fits this task.

## Contributing to it

See [CLAUDE.md](CLAUDE.md) for how skills are written here.
