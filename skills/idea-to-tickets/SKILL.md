---
name: idea-to-tickets
description: Turn a raw product or feature idea into a short spec and a set of ordered, labeled GitHub issues that ticket-to-pr can work one by one. Use when the user has an idea, a feature request, or an app they want to build and wants it scoped, broken down, planned into tickets, or turned into a backlog or epic in a GitHub repo.
argument-hint: "[idea]"
compatibility: Requires git and the GitHub CLI (gh). Run from a local clone of a GitHub repository, or from an empty folder to create one.
---

# idea-to-tickets

Turn one idea into a spec file and a backlog of GitHub issues. Every issue follows the spkstack ticket contract: `../../docs/ticket-contract.md`, relative to this skill's base directory. Read it before step 5. The next step after this skill is `/spkstack:ticket-to-pr`.

GitHub only, via `gh`. Other trackers are out of scope.

Idea (may be empty): $ARGUMENTS

If no idea was given, ask for it in one line and wait.

## Hard limits

- Do not file issues, create labels, or create a repo before the user approves the ticket table (step 5) or the repo creation (step 1).
- Do not push to the default branch. The spec lands through a pull request.
- Do not merge.
- Do not invent facts: users, prices, competitors, URLs, numbers. If the idea needs them and the user did not give them, write `TODO` and put the question in the spec's Open questions.
- Do not write code in this skill. Scaffolding is a ticket, not a side effect.
- Write concisely in the spec and issues. No em dashes. No emoji.

## 1. Preflight

1. `git rev-parse --show-toplevel`. If this is not a git checkout, ask whether to create a repo here. Only on a yes: `git init`, then `gh repo create <name> --private --source . --remote origin` (ask for the name and visibility; private is the default).
2. Identify `owner/repo` from `git remote -v` (prefer `origin`). No GitHub remote, or more than one plausible repo: stop and ask.
3. `gh auth status` must succeed with write access. If not, tell the user to run `gh auth login`.
4. `git status` must be clean. If not, stop and say so. Do not stash or discard.
5. Detect the base branch: `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`. Note whether it exists on the remote (an empty repo has none).
6. Classify the repo:
   - **Greenfield**: no commits, or only a README / license.
   - **Existing**: has code. Read `README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/`, manifests and lockfiles, and skim the top-level layout, so tickets fit the real stack and name real files.
7. Check for overlap: `gh issue list --state open --limit 100 --json number,title,labels` and `ls docs/specs 2>/dev/null`. If an open epic or spec already covers this idea, say so and ask whether to extend it or start a new one.

## 2. Forcing questions

Ask four to six short questions with AskUserQuestion, in at most two rounds. Skip any the idea or the repo already answers, and say what you inferred instead. Offer concrete options, with your recommended answer first.

1. **Who** is it for? One specific user, not "everyone".
2. **Pain**: what do they do today without it, and what is bad about that?
3. **Smallest useful version**: what is the least that person would actually use this week?
4. **Out**: what is explicitly not in the first version?
5. **Constraints**: stack, hosting, budget, deadline, existing services to reuse. For greenfield, recommend a stack and say why in one line.
6. **Done**: how will we know it works? A demo path, a metric, or a test.

## 3. MVP cut

Propose the cut in at most ten lines:

- One sentence: what the MVP does, for whom.
- In: three to seven bullets.
- Out: the things deliberately deferred.
- Stack (greenfield) or touch points (existing).
- Phases, if the work naturally splits (for example: MVP, then v1).

Ask the user to approve or edit. Do not write files until they approve.

## 4. Spec

Pick a short kebab-case `<slug>`. Write `docs/specs/<slug>.md`:

```markdown
# <Title>

## Problem
## Users
## MVP scope
## Out of scope
## Approach
<architecture sketch, main data shapes, key flows; name real files in an existing repo>
## Phases
## Risks
## Open questions
<every TODO lives here>
```

Keep it to what the tickets need. A page or two, not a design doc for its own sake.

Land it through a pull request:

- Base branch exists on the remote: branch `spec-<slug>` from its tip, commit `docs: add <slug> spec`, push, `gh pr create --title "Spec: <Title>" --body "<two line summary>"`.
- Empty repo (no base branch on the remote): a PR has no base. Stop and ask the user to choose:
  - A. The user (or you, only after they say yes) pushes a minimal README commit to `origin/<base>`, then you open the spec PR as above.
  - B. The user explicitly allows the spec commit to be the first commit on `origin/<base>`. That is the only allowed push to the default branch, and only with that OK.

Record the spec PR number. Tickets link to it.

## 5. Break down

Slice the MVP into tickets following the contract's sizing rule:

- One ticket = one PR that is verifiable on its own. Vertical slices over layers.
- Only `size:s` and `size:m`. Split anything bigger.
- Greenfield: ticket 1 is the scaffold (skeleton, lint / typecheck / test / build commands, CI workflow). Every other ticket depends on it.
- Add `Depends on` only for real ordering constraints, so independent tickets can run in parallel.
- Priorities: the critical path to a usable MVP is `p1`, polish is `p2` or `p3`. Use `p0` only if the user said something is urgent.
- Put deferred phases in the spec, not in tickets, unless the user asks for them now.

Show the full plan as a table and wait for approval:

| # | Title | Type | Priority | Size | Depends on |
|---|---|---|---|---|---|
| 1 | Scaffold project and CI | engineering | p1 | s | - |
| 2 | ... | feature | p1 | m | 1 |

Use plan positions (1, 2, ...) here. Real issue numbers come in step 6. Apply edits and show the table again until the user approves.

## 6. File

1. Create the labels from the contract (`gh label create ... --force`, idempotent).
2. Create the epic: title `[epic] <Title>`, label `epic`, body with the summary and spec link. Task list comes last.
3. Create the tickets in dependency order, so every `Depends on #N` uses a real number. Body follows the contract template, with `Spec:` and `Epic:` filled in. Write each body to a temp file and pass it with `--body-file` to keep formatting intact. Record each new number.
4. Edit the epic body to add the task list of children in landing order (`gh issue edit <epic> --body-file ...`).
5. Only if the user asked for one: create a milestone `<slug> MVP` and attach the tickets.

If any `gh` call fails midway, stop, report what was created (numbers and URLs), and do not retry blindly. Re-running must not duplicate issues: check titles against `gh issue list` before creating.

## 7. Report

Tell the user, briefly:

- Spec PR URL (and that it should be merged before or alongside the first ticket)
- Epic URL
- Ticket count, and which ones can start now (no unmet dependencies)
- Any `TODO`s or `needs-info` tickets waiting on them
- Next: `/spkstack:ticket-to-pr` (no number picks the top eligible ticket)
