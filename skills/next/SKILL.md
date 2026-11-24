---
name: next
description: Work every ticket of a GitHub epic that can start now, one after another, by running ticket-to-pr on each and opening one PR per ticket. Use when the user wants to work the epic, run all the tickets, do the next tickets, keep going through an epic, or stop typing ticket-to-pr once per ticket.
argument-hint: "[epic-number]"
compatibility: Requires git, the GitHub CLI (gh), and the spkstack ticket-to-pr skill. Run from a local clone of a GitHub repository.
---

# next

Run `/spkstack:ticket-to-pr` in unattended mode on each child of one epic that can start now, in the order of the epic's Tickets list, one at a time. One approval up front covers the whole pass. GitHub only, via `gh`.

The epic, eligibility, and unattended runs are defined in the spkstack ticket contract: `../../docs/ticket-contract.md`, relative to this skill's base directory. Read it once at the start.

This skill never merges, so a ticket that depends on a PR from this pass waits for the next pass. Merge, then run it again.

Epic argument (may be empty): $ARGUMENTS

## Hard limits

- Do not merge. Do not push to the default branch.
- Do nothing outward-facing (claims, comments, branches, pushes, PRs) before the user approves the queue in step 3.
- Work only the tickets in the approved queue. Do not add tickets during a pass, and never work an issue outside the epic.
- Do not edit the epic: not its body, labels, or Tickets list.
- One ticket at a time, each from a clean, up-to-date base branch. No parallel runs, no stacked branches.
- Write concisely. No em dashes. No emoji.

## 1. Preflight

Run ticket-to-pr's preflight checks 1 to 5 yourself: git checkout, GitHub repo from `origin`, clean tree, `gh auth status` with write access, base branch, `git fetch origin`. If the base branch is missing on the remote, stop and tell the user to run `/spkstack:ticket-to-pr` once by hand. If any check fails, stop and say which: every ticket would be skipped for the same reason.

## 2. Find the epic and build the queue

1. The epic:
   - A number was given (a leading `#` is fine): it must be open and labeled `epic`. Otherwise stop and say why.
   - No number: `gh issue list --repo OWNER/REPO --label epic --state open --json number,title`. Exactly one: use it. Several: ask which, and wait. None: stop and suggest `/spkstack:idea-to-tickets`.
2. Read the epic with `gh issue view <E>`. Take the issue numbers from its `## Tickets` task list, in order. Use each issue's state, not the checkbox, to know what is done.
3. Gather state the way ticket-to-pr step 2 does (open issues, open PRs with `closingIssuesReferences`, `git ls-remote --heads origin`) and the current `gh` user.
4. Sort each listed ticket into one group:
   - **Done**: closed.
   - **Runs**: eligible under the contract's Eligibility section.
   - **Blocked**: not eligible. Keep the reason (for example `depends on #12`, `needs-info`, `PR #20 open`, `assigned to someone else`).
5. Open issues whose body says `Epic: #<E>` but that are missing from the Tickets list are not run. Mention them in step 3 so the user can add them to the list.

A ticket that depends on another ticket in this epic is blocked until that ticket is closed. So dependents of anything this pass works are never in this pass's queue, whatever result that ticket gets.

## 3. Approve the queue

Show the queue in Tickets-list order:

| # | Title | Status |
|---|---|---|
| 12 | ... | runs |
| 13 | ... | blocked: depends on #12 |
| 11 | ... | done |

Then say what approval covers. For each ticket that runs, ticket-to-pr will comment and assign itself, comment its plan, push a branch `<N>-<slug>`, and open a PR, or a draft PR when a check stays red or sources are missing. If it cannot proceed without the user, it comments numbered questions on the ticket and adds `needs-info` instead.

Ask once and wait. If the user drops tickets, remove them, show the queue again, and ask again. If nothing runs, skip to step 5.

## 4. Run

For each ticket in the approved queue, in order:

1. Make sure the tree is clean, check out the base branch, and `git pull --ff-only origin <base>`. If that fails, stop the pass and go to step 5.
2. Check the ticket is still eligible (state can change during a pass). If not, record `skipped: <reason>` and move on.
3. Run `/spkstack:ticket-to-pr <N> --unattended` (Skill tool, args `<N> --unattended`). The user's approval in step 3 is the approval that unattended runs require.
4. Read the last line of its output:
   - `opened #<PR>` or `draft #<PR>`: record it.
   - `skipped: <reason>`: record it. If the reason is about the environment (not a git checkout, remote, `gh` auth, dirty tree, base branch), stop the pass: the remaining tickets would hit the same problem.
   - No result line: check `gh pr list --search "<N>" --state open` for a PR that closes the ticket, and record what you find as `unclear: <what you found>`.
5. Tell the user one line, for example `#12 Add login: opened #20 (2 of 4)`.
6. Keep only the result in mind for the rest of the pass. Do not re-read that ticket's files or diff.

Do not retry a ticket in the same pass.

## 5. Report

Tell the user, briefly:

- The epic URL.
- Opened: each ticket with its PR URL.
- Draft: each ticket with its PR URL and why (failing check or `TODO`s).
- Skipped: each ticket with its reason. For `needs-info`, the questions are on the ticket.
- Blocked: each ticket and what it waits on.
- Unclear: each ticket with what you found.
- Not in the Tickets list, if any (step 2.5).
- Next: review and merge the PRs, answer any `needs-info` questions, then run `/spkstack:next <E>` again. If every listed ticket is closed, say the epic can be closed; do not close it.
