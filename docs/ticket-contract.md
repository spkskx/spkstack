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
```

Every ticket has exactly one type label, one priority label, and one size label. There is no `size:l`: a ticket that big gets split.

## Ticket body

```markdown
## Context
Spec: docs/specs/<slug>.md (PR #<spec-pr>)
Epic: #<epic>

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

## Epic

One tracking issue per spec:

- Title: `[epic] <idea in a few words>`
- Labels: `epic`
- Body: a two to four line summary, a link to the spec, and a task list of the child tickets in the order they should land:

```markdown
- [ ] #12 Scaffold project and CI
- [ ] #13 <...>
```

`ticket-to-pr` never picks an issue labeled `epic`.

## Spec file

Lives at `docs/specs/<slug>.md` in the target repository, where `<slug>` is short kebab-case. It is added through a pull request on branch `spec-<slug>`, never pushed to the default branch. Tickets link to it by path; until the spec PR merges, read it from that branch.
