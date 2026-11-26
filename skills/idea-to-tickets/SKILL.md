---
name: idea-to-tickets
description: Turn a raw product or feature idea into GitHub issues: an epic that holds the spec, plus ordered, labeled tickets that ticket-to-pr can work one by one. Use when the user has an idea, a feature request, or an app they want to build and wants it scoped, grilled, stress-tested, broken down, planned into tickets, or turned into a backlog or epic in a GitHub repo or project.
argument-hint: "[idea]"
compatibility: Requires the GitHub CLI (gh). Run from a local clone of a GitHub repository, or name the repo.
---

# idea-to-tickets

Turn one idea into GitHub issues: an epic whose body is the spec, and the tickets that build it. Every issue follows the spkstack ticket contract: `../../docs/ticket-contract.md`, relative to this skill's base directory. Read it before step 4. Step 2 follows the grilling protocol: `../../docs/grilling.md`, same base. Read it before step 2. The next step after this skill is `/spkstack:ticket-to-pr`.

The only output is issues (and, if asked, items on a GitHub Project). No files, branches, commits, or pull requests.

GitHub only, via `gh`. Other trackers are out of scope.

Idea (may be empty): $ARGUMENTS

If no idea was given, ask for it in one line and wait.

## Hard limits

- Do not write files, create branches, commit, push, or open pull requests.
- Do not file issues, create labels, or create a repo before the user approves the ticket table (step 5) or the repo creation (step 1).
- Do not invent facts: users, prices, competitors, URLs, numbers. If the idea needs them and the user did not give them, write `TODO` and put the question in the spec's Open questions.
- Do not write code. Scaffolding is a ticket, not a side effect.
- Write concisely in issues. No em dashes. No emoji.

## 1. Preflight

1. Find the target repo:
   - If the user named one (`owner/repo`), use it.
   - Otherwise, from `git remote -v` in the current directory (prefer `origin`).
   - No GitHub repo, or more than one plausible one: ask. If the user wants a new one, create it only on a yes: `gh repo create <name> --private` (ask for name and visibility; private is the default).
2. `gh auth status` must succeed with write access to issues. If not, tell the user to run `gh auth login`.
3. Classify the repo:
   - **Greenfield**: as defined in the contract's Sizing rule: no commits, or no files besides `README*`, `LICENSE*`, `.gitignore`, and `CLAUDE.md`.
   - **Existing**: has code. If it is the local checkout, read `README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/`, manifests and lockfiles, and skim the top-level layout. If it is remote only, read the same through `gh api repos/OWNER/REPO/contents/<path>` or `gh repo view`. Tickets must fit the real stack and name real files.
4. Check for overlap: `gh issue list --repo OWNER/REPO --state open --limit 100 --json number,title,labels`. If an open epic already covers this idea, say so and ask whether to extend it or start a new one.

## 2. Grill the idea

Grill the user as `grilling.md` describes, until the frontier is empty or the user says to go with your recommendations. These are the root branches of the design tree; answers open new branches under them:

1. **Who** is it for? One specific user, not "everyone".
2. **Pain**: what do they do today without it, and what is bad about that?
3. **Smallest useful version**: what is the least that person would actually use this week?
4. **Out**: what is explicitly not in the first version?
5. **Constraints**: stack, hosting, budget, deadline, existing services to reuse. For greenfield, recommend a stack and say why in one line.
6. **Done**: how will we know it works? A demo path, a metric, or a test.

Settle what the idea or the repo already answers without asking, and say what you found. Keep the decisions and assumptions for the spec's Decisions section, and the unknown facts for Open questions. The MVP cut in step 3 is the restatement the user confirms.

## 3. MVP cut

Propose the cut in at most ten lines:

- One sentence: what the MVP does, for whom.
- In: three to seven bullets.
- Out: the things deliberately deferred.
- Stack (greenfield) or touch points (existing).
- Phases, if the work naturally splits (for example: MVP, then v1).

Ask the user to approve or edit before going on.

## 4. Spec draft

Draft the epic body in the contract's Epic format (Problem, Users, MVP scope, Out of scope, Approach, Decisions, Phases, Risks, Open questions). Decisions holds what step 2 settled. Keep it to what the tickets need: a page or two, not a design doc for its own sake. Hold it in the conversation; it is filed in step 6.

## 5. Break down

Slice the MVP into tickets following the contract's sizing rule:

- One ticket = one PR that is verifiable on its own. Vertical slices over layers.
- Only `size:s` and `size:m`. Split anything bigger.
- Greenfield: ticket 1 is the scaffold (skeleton, lint / typecheck / test / build commands, CI workflow). Every other ticket depends on it.
- Add `Depends on` only for real ordering constraints, so independent tickets can run in parallel.
- Priorities: the critical path to a usable MVP is `p1`, polish is `p2` or `p3`. Use `p0` only if the user said something is urgent.
- Put deferred phases in the spec's Phases section, not in tickets, unless the user asks for them now.
- If slicing hits a decision the user has not made (which slice first, whether something is in the MVP), grill that branch before showing the table, and add the answer to Decisions.

Show the spec draft and the full ticket table together, and wait for approval:

| # | Title | Type | Priority | Size | Depends on |
|---|---|---|---|---|---|
| 1 | Scaffold project and CI | engineering | p1 | s | - |
| 2 | ... | feature | p1 | m | 1 |

Use plan positions (1, 2, ...) here. Real issue numbers come in step 6. Also ask whether to add the issues to a GitHub Project (board) or a milestone; default is neither. Apply edits and show again until the user approves.

## 6. File

Write each body to a temp file (`mktemp`) and pass it with `--body-file`, to keep formatting intact.

1. Create the labels from the contract (`gh label create ... --force`, idempotent).
2. Create the epic: title `[epic] <Title>`, label `epic`, body = the approved spec, with an empty `## Tickets` section at the end.
3. Create the tickets in dependency order, so every `Depends on #N` uses a real number. Body follows the contract template, with `Epic: #<epic>` filled in. Record each new number.
4. Edit the epic body to fill the Tickets task list with the children in landing order (`gh issue edit <epic> --body-file ...`).
5. Only if the user asked:
   - Milestone: create `<Title> MVP` (`gh api repos/OWNER/REPO/milestones -f title=...`) and attach the tickets with `gh issue edit <N> --milestone`.
   - GitHub Project: `gh project list --owner OWNER` to find it (ask which if several), then `gh project item-add <number> --owner OWNER --url <issue-url>` for the epic and every ticket. If `gh` lacks the `project` scope, tell the user to run `gh auth refresh -s project` and skip this part.

Re-running must not duplicate issues: before creating, check titles against `gh issue list`. If any `gh` call fails midway, stop, report what was created (numbers and URLs), and do not retry blindly.

## 7. Report

Tell the user, briefly:

- Epic URL (it holds the spec)
- Ticket count, and which ones can start now (no unmet dependencies)
- Project or milestone, if used
- Any `TODO`s or `needs-info` tickets waiting on them, and any `(assumed)` decisions they may want to revisit
- Next: `/spkstack:ticket-to-pr` (no number picks the top eligible ticket)
