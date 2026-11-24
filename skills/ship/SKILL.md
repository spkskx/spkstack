---
name: ship
description: Make every open pull request of a GitHub epic merge-ready in one pass: clear merge conflicts, fix failing checks, and address review threads, pushing only to each PR's branch. Use when the user wants to ship the epic, get the PRs green, fix conflicts after a merge, clean up the PRs that /spkstack:next opened, or make PRs ready to merge.
argument-hint: "[epic-number]"
compatibility: Requires git and the GitHub CLI (gh). Run from a local clone of a GitHub repository.
---

# ship

One pass over the open PRs of one epic. For each, in turn: merge the base branch in to clear conflicts, fix failing checks, address unresolved review threads, push to the PR branch, and comment what was done. One approval up front covers the pass. GitHub only, via `gh`.

The epic and its Tickets list are defined in the spkstack ticket contract: `../../docs/ticket-contract.md`, relative to this skill's base directory. Read it once at the start.

Epic argument (may be empty): $ARGUMENTS

This skill is one pass, not a watch. To keep watching one PR until it merges, the user can type `/steward` on its branch; ship does not call it. For acceptance criteria, use `/spkstack:review`.

## Hard limits

- Do not merge, approve, or close a PR. Do not push to the default branch. Do not force-push.
- Do nothing outward-facing (pushes, comments, thread replies) before the user approves the table in step 3.
- Touch only the PRs in the approved table. Never push to a branch from a fork.
- Do not edit the epic, the tickets, or PR titles and bodies. Do not resolve review threads: reply, and leave resolving to the reviewer.
- Do not change a ticket's scope to make a check pass: no deleting or skipping tests, no disabling checks. If that is the only way, leave it and say so on the PR.
- One PR at a time, starting each from a clean tree.
- Write concisely. No em dashes. No emoji.

## 1. Preflight

From the repository root: git checkout, GitHub repo from `origin`, clean tree (`git status`), `gh auth status` with write access, base branch (`gh repo view --json defaultBranchRef`), `git fetch origin`. If any check fails, stop and say which.

Read the repo's `README.md`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, and CI workflows once, to know its checks and conventions (for example, a version bump on every change).

## 2. Find the PRs

1. The epic: a number was given (a leading `#` is fine): it must be open and labeled `epic`. No number: `gh issue list --label epic --state open --json number,title`. Exactly one: use it. Several: ask which, and wait. None: stop and say so.
2. Take the ticket numbers from the epic's `## Tickets` task list.
3. `gh pr list --state open --limit 100 --json number,title,url,headRefName,baseRefName,isDraft,isCrossRepository,mergeable,mergeStateStatus,closingIssuesReferences`. Keep the PRs whose `closingIssuesReferences` include a listed ticket.
4. For each kept PR, gather:
   - CI: `gh pr checks <P>`. Failing, pending, passing, or none.
   - Conflicts: `mergeable` (`CONFLICTING` means conflicts; `UNKNOWN` means GitHub has not computed it yet, so check again once).
   - Review threads that are not resolved:

     ```bash
     gh api graphql -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){reviewThreads(first:100){nodes{id isResolved isOutdated path line comments(first:20){nodes{author{login} body url}}}}}}}' -F o=OWNER -F r=REPO -F n=<P>
     ```

   - Whether it is behind the base branch (`mergeStateStatus` `BEHIND`).

## 3. Approve the table

Show the PRs in Tickets-list order:

| PR | Ticket | CI | Conflicts | Open threads | Plan |
|---|---|---|---|---|---|
| #20 | #12 | failing: test | yes | 2 | merge base, fix test, address 2 threads |
| #21 | #13 | passing | no | 0 | nothing to do |
| #22 | #14 | - | - | - | skip: branch is on a fork |

Then say what approval covers: for each PR with work to do, ship checks out its branch, may add a merge commit from the base branch and fix commits, pushes to that branch (never force), replies on the review threads it addressed, and posts one comment on the PR saying what it did.

Ask once and wait. If the user drops PRs, remove them, show the table again, and ask again. If nothing has work to do, go to step 5.

## 4. Work each PR

For each approved PR with work to do, in order:

1. Tree clean. `gh pr checkout <P>`, then `git pull --ff-only` so the branch matches the remote.
2. **Conflicts or behind**: `git merge origin/<base>`. Resolve each conflict by keeping the intent of both sides. Follow the repo's conventions: for example, if it bumps a version on every change, resolve a version conflict to one step above the base branch's version. If a conflict cannot be resolved with confidence, `git merge --abort` and record it as not fixed.
3. **Failing checks**: read the failure (`gh run view <run-id> --log-failed`, or run the same command locally). Fix the cause in this PR's code. Run the repo's own checks locally, the way CI does, until green.
4. **Review threads**: for each unresolved, non-outdated thread, read it and the code it points at. If it asks for a change that fits the ticket, make it. If it does not (out of scope, a question, a disagreement), do not change code. Either way, reply in the thread afterwards saying what changed (with the commit) or why not.
5. Commit with clear messages. `git push` (no `--force`). If the push is rejected, stop work on this PR and record it.
6. Post one PR comment headed `## ship`: what was fixed (conflicts, checks, threads, each with its commit), and what was not, each with the problem and the command that shows it.
7. Check out the base branch. Tell the user one line, for example `#20 (#12): merged main, fixed test, 2 threads (1 of 3)`.

Do not retry a PR in the same pass. Do not re-read a finished PR's diff later in the pass.

## 5. Report

Tell the user, briefly:

- The epic URL.
- Fixed: each PR with its URL and what changed.
- Not fixed: each PR with what is left and why.
- Skipped: each PR with its reason (fork, dropped by the user, nothing to do).
- Next: review and merge the PRs, then run `/spkstack:next <E>` for any tickets that waited on them. For a PR that needs watching until it merges, type `/steward` on its branch.
