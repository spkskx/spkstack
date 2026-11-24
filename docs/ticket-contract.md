# Ticket contract

The format of a GitHub issue that spkstack can work. `/spkstack:idea-to-tickets` writes issues in this format. `/spkstack:ticket-to-pr` reads them. Change this file first when the format changes, then update both skills.

## Labels

Create them idempotently before filing issues:

```bash
gh label create bug         --color d73a4a --description "Something is broken" --force
gh label create feature     --color a2eeef --description "New or changed behavior" --force
gh label create engineering --color 5319e7 --description "Tooling, CI, refactors, infra in code" --force
gh label create docs        --color 0075ca --description "Documentation or content" --force
gh label create p0          --color b60205 --description "Drop everything" --force
gh label create p1          --color d93f0b --description "Next up" --force
gh label create p2          --color fbca04 --description "Normal" --force
gh label create p3          --color c2e0c6 --description "Nice to have" --force
gh label create size:s      --color ededed --description "Under half a day" --force
gh label create size:m      --color bfdadc --description "About a day" --force
gh label create epic        --color 3e4b9e --description "Tracking issue, not worked directly" --force
gh label create needs-info  --color d876e3 --description "Waiting on input from the user" --force
```

Every ticket has exactly one type label, one priority label, and one size label. There is no `size:l`: a ticket that big gets split.

## Ticket body

```markdown
## Context
Epic: #<epic> (holds the spec)

## Goal
<one or two sentences: what is true when this is done>

## Acceptance criteria
- [ ] <observable, testable statement>
- [ ] <...>

## Out of scope
- <what this ticket does not do, and which ticket does it if any>

## Hints
- <files, modules, or approaches worth knowing; optional>

Depends on #<N>
```

- `Depends on #N` is one line per dependency and only appears when the ticket truly cannot start before #N is merged.
- Acceptance criteria are things a reviewer can check without asking the author. "Works well" is not one.
- Never invent facts, prices, URLs, or names. Mark gaps `TODO` and add the `needs-info` label.

## Sizing rule

One ticket is one pull request that can be verified on its own: it adds or changes a check, a test, or a visible behavior. Prefer vertical slices (a thin path through every layer) over horizontal layers (all models, then all endpoints, then all UI).

In a greenfield repo the first ticket is always the scaffold: project skeleton, the lint, typecheck, test, and build commands, and a CI workflow that runs them. Every later ticket depends on it, so `ticket-to-pr` always has real checks to run.

## Epic (the spec lives here)

One tracking issue per idea. Its body is the spec, so planning produces only GitHub issues: no files, no branches, no pull requests.

- Title: `[epic] <idea in a few words>`
- Labels: `epic`
- Body:

```markdown
## Problem
## Users
## MVP scope
## Out of scope
## Approach
<architecture sketch, main data shapes, key flows; real files in an existing repo>
## Phases
## Risks
## Open questions
<every TODO lives here>

## Tickets
- [ ] #12 Scaffold project and CI
- [ ] #13 <...>
```

The Tickets task list holds the children in the order they should land. When the spec changes, edit the epic body and say what changed in a comment on it.

`ticket-to-pr` never picks an issue labeled `epic`. It reads the epic as the spec for any ticket that links it.

## Eligibility

An open issue can be worked unless any of these is true (label matches are case-insensitive):

- It has a label `blocked`, `wontfix`, `question`, or `epic`, or a label that starts with `needs-` (for example `needs-info`, `needs-design`). An `epic` is a tracking issue: work its children, never the epic itself.
- It is assigned to someone other than the current `gh` user. Unassigned issues are eligible. Already assigned to the current user is eligible (treat as already claimed).
- An open PR already closes or links it (`closingIssuesReferences`, or the PR title or body cites `#N`), or `origin` has a branch named `N-*`.
- A `Depends on #N` or `Blocked by #N` line in the body points at an issue that is still open. A dependency is met only when that issue is closed, or its closing PR is merged. Also parse a `Dependencies:` line that lists `#N`.

Which eligible issue goes first is up to the skill that picks.

## Unattended runs

Another skill can run `ticket-to-pr` on one ticket without anyone answering questions mid-run. The caller passes `<N> --unattended`, and must already have the user's approval for the whole run (claim, branch, push, PR). The hard limits of `ticket-to-pr` still apply.

At every point where `ticket-to-pr` would stop and ask, it does this instead:

| Situation | Action | Result |
|---|---|---|
| No issue number given | Nothing | `skipped: no issue number` |
| Not a git checkout, no GitHub remote or more than one plausible one, `gh` not signed in or cannot write, dirty tree, base branch missing on the remote | Nothing. The issue is not touched | `skipped: <problem>` |
| Issue is not eligible (closed, a label above, assigned to someone else, open PR or branch, unmet dependency) | Nothing. No other issue is picked | `skipped: <rule that failed>` |
| Acceptance criteria are ambiguous, or the ticket needs facts only the user can supply | Comment the questions on the issue as a numbered list, add `needs-info` (create the label first if missing), no branch, no PR | `skipped: needs-info` |
| Content or docs ticket missing sources | Draft structure with `TODO`s, as in an attended run | `draft #<PR>` |
| A check stays red and this run cannot fix it | Push the branch and open a draft PR that names the failing check and the command that shows it | `draft #<PR>` |

The run ends on the base branch with a clean tree, so the caller can start the next ticket. Its last line is exactly one of:

```
opened #<PR>
draft #<PR>
skipped: <reason on one line>
```
