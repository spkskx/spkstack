---
name: retro
description: Turn lessons from a spkstack run into tickets on the spkstack repo, so ticket-to-pr can fold them back into the skills. Use when the user wants a retro, wants to capture what went wrong or was awkward in a run, says a skill should have handled something better, or wants to improve spkstack from what just happened.
argument-hint: "[epic-number]"
compatibility: Requires the GitHub CLI (gh). Run from the project repo the run happened in, or from the spkstack checkout.
---

# retro

Collect what a spkstack run taught about the skills themselves, and file each lesson as a ticket on the spkstack repo. The edits happen later, through `/spkstack:ticket-to-pr` on that repo. GitHub only, via `gh`.

Tickets follow the spkstack ticket contract: `../../docs/ticket-contract.md`, relative to this skill's base directory. Read it before step 4.

Epic argument (may be empty): $ARGUMENTS

## Hard limits

- Do not edit skill files, docs, or any file. This skill only files issues.
- File only on the spkstack repo (step 1). Never file, comment, or change labels on the project repo.
- File nothing before the user approves the table in step 3. Do not create an epic for a retro.
- Lessons are about spkstack: a skill step that was wrong, missing, ambiguous, or left manual work. Bugs in the project's own code are not lessons.
- Every lesson cites evidence: a link to a comment, PR, or issue, or a quoted line from this session. No evidence, no row.
- Write concisely. No em dashes. No emoji.

## 1. Find the repos

1. The spkstack repo: read `../../.claude-plugin/plugin.json`, relative to this skill's base directory, and take `owner/repo` from its `repository` URL. `gh auth status` must be able to write issues there.
2. The project repo: `origin` in the current checkout, if any. It is read-only here. It may be the spkstack repo itself.
3. The epic (optional): a number was given (a leading `#` is fine): use it in the project repo. None: `gh issue list --label epic --state all --limit 5 --json number,title,state,updatedAt` and use the most recently updated, saying which. No epic: use the session only.

## 2. Gather lessons

Read, when they exist:

- **This session**: what the user corrected, steps that were skipped or done twice, questions a skill should have answered itself, workarounds, and anything a skill said that turned out wrong.
- **The epic**: `gh issue view <E> --comments`. The `## next pass` comments (skipped and unclear tickets, stopped passes) and any spec edits that came late.
- **Its tickets**: for each in the Tickets list, `needs-info` questions (what the spec should have said) and ticket edits made after filing.
- **Its PRs**: `gh pr list --state all --search "<ticket numbers>"` for the PRs that closed or close them. Their comments (`## review`, `## ship`, self-reviews) and review threads: repeated `not met` items, residual risks, draft reasons, conflicts.

Keep a candidate only if a change to a named skill or doc would have prevented it. Merge duplicates. Drop one-offs that no rule would fix.

Check existing issues on the spkstack repo (`gh issue list --state all --limit 200 --json number,title,state`). Drop a lesson an open issue already covers; mention it instead. A closed issue that covered it means the fix did not hold: keep the lesson and link the old issue.

## 3. Approve the table

| # | Lesson | Evidence | Change | Ticket title | Labels |
|---|---|---|---|---|---|
| 1 | next re-asked approval mid-pass | link or quote | `skills/next/SKILL.md` step 2 | next: resume an approved pass | feature, p2, size:s |

Ask once. The user can drop, merge, or reword rows, or change labels. Show the table again after edits and ask again. If no rows are left, go to step 5.

## 4. File

For each approved row, in table order:

1. Create the contract labels on the spkstack repo if missing (`gh label create ... --force`, as the contract lists).
2. Write the body to a temp file (`mktemp`) in the contract's ticket format:
   - Context: `Epic: #<N>` if an open spkstack epic clearly covers it, otherwise `Epic: none`, then `From /spkstack:retro on <project repo>#<E>` (or `on <project repo>` with no epic).
   - Goal: the skill behavior that is true when done.
   - Acceptance criteria: checkable statements about the skill or doc text.
   - Out of scope, and Hints with the evidence links and the exact file and step to change.
3. `gh issue create --repo <spkstack repo> --title <title> --label <labels> --body-file <file>`. Record the number.

If a call fails, stop, report what was filed, and do not retry.

## 5. Report

Tell the user, briefly:

- The lessons filed, each with its issue URL.
- Lessons dropped because an open issue covers them, with that issue.
- Next: `/spkstack:ticket-to-pr <N>` in the spkstack checkout, or `/spkstack:next` if the lessons were added to a spkstack epic.
