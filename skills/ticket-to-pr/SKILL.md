---
name: ticket-to-pr
description: Pick a GitHub issue, plan and implement it, then open a pull request that closes the issue. Use when the user wants to pick up a ticket, work the next issue, run a ticket-to-PR workflow in any GitHub repo, or unblock a needs-info ticket by answering its questions, optionally with an issue number.
argument-hint: "[issue-number] [--unattended]"
compatibility: Requires git and the GitHub CLI (gh). Run from a local clone of a GitHub repository.
---

# ticket-to-pr

Turn one GitHub issue into an implementation and a pull request. GitHub only, via `gh`. Other trackers (Jira, Linear, GitLab, and similar) are out of scope. If the work is not in a GitHub repo, or `gh` cannot see issues, stop and say so.

Issues are expected in the spkstack ticket contract: `../../docs/ticket-contract.md`, relative to this skill's base directory. Read it once at the start of a run. Issues that do not follow it are still workable; the contract just makes ranking and planning reliable. `/spkstack:idea-to-tickets` writes issues in that format. When a ticket needs the user's decisions, step 3 grills the user as `../../docs/grilling.md` describes (same base); read it only then.

Issue argument (may be empty): $ARGUMENTS

- If a number was provided (a leading `#` is fine), use that issue after the checks in step 2.
- If none was provided, pick the highest-value open issue as defined in step 2.
- If `--unattended` is present, run in unattended mode (below).

## Hard limits

- Do not merge.
- Do not push to the default branch (the only exception is the empty-repo path in step 1, and only after the user says yes).
- Do not request reviewers unless the user or the repo docs explicitly ask for it.
- Do not touch secrets, infra dashboards, DNS, or billing. If the ticket needs those, put numbered manual steps in the PR instead.
- Do not invent facts in content or docs. Mark gaps `TODO` and open a draft PR.
- Write concisely in commits, comments, and the PR. No em dashes. No emoji.

## Unattended mode

For another skill that runs this one in a loop, such as `/spkstack:next`. Follow the contract's Unattended runs section: it needs an issue number, never asks the user anything, and replaces every "stop", "stop and ask", or "stop and tell the user" below with the action it lists. End on the base branch with a clean tree, and make the last line of output the result line it defines. Without `--unattended`, ignore this section.

## 1. Preflight

Run these from the repository root.

1. Confirm this directory is a git checkout (`git rev-parse --show-toplevel`) and identify the GitHub repo from `git remote -v`. Prefer `origin`. Parse `owner/repo` from an `github.com` SSH or HTTPS URL. If there is no GitHub remote, or more than one plausible repo and it is unclear which to use, stop and ask.
2. `git status` must be clean (no staged or unstaged changes, and no untracked files you did not just create for this run). If it is not, stop and tell the user. Do not stash, commit, or discard other work.
3. `gh auth status` must succeed and must be able to read and write this repo. If not, tell the user to run `gh auth login`.
4. Detect the default branch: `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` (usually `main` or `master`). Call this the base branch. If `gh` cannot report one, fall back to the remote `HEAD` symbolic ref.
5. `git fetch origin`.
6. If the base branch exists on the remote: check it out, `git pull --ff-only origin <base>`, and create the work branch from that tip in step 4.
7. If the base branch does not exist on the remote (empty repo, no commits): a pull request has no base. Stop and ask the user to choose one of:
   - A. The user (or you, only after the user says yes) pushes a minimal README or empty commit to `origin/<base>`, then you implement the ticket on `<issue#>-<slug>` and open a PR against the base branch.
   - B. The user explicitly allows you to push this ticket's work as the first commit on `origin/<base>`. That is the only allowed push to the default branch, and only with that OK.
   - Do not invent another path. Do not force-push.

## 2. Pick the ticket

Gather state (replace `OWNER/REPO` with the detected repo):

```bash
gh issue list --repo OWNER/REPO --state open --limit 100 \
  --json number,title,labels,assignees,body,url,milestone,updatedAt
gh pr list --repo OWNER/REPO --state open --limit 100 \
  --json number,title,body,headRefName,closingIssuesReferences
git ls-remote --heads origin
```

If a number was provided, load that issue with `gh issue view` as well.

An issue is ineligible when any rule in the contract's Eligibility section applies. Check every rule against the state gathered above.

From the eligible set, rank and pick the first issue, using these keys in order:

1. Priority labels, if any are present in the eligible set. Higher first. Treat at least: `p0` / `priority:p0` / `critical` / `urgent` (highest), then `p1` / `priority:high` / `high`, then `p2` / `priority:medium` / `medium`, then `p3` / `priority:low` / `low`. An issue with no priority label ranks after one that has a known priority.
2. Milestone due date, sooner first. Issues with a milestone due date beat issues with no due date.
3. Type, unless README, CONTRIBUTING, CLAUDE.md, or AGENTS.md say otherwise: `bug` and `engineering` before `feature` / `enhancement`, then those before `content` / `docs` / `documentation`.
4. Size, small first, if size labels exist in the eligible set (`size:s`, `size:small`, `xs`, `s`, then `m`, then `l` / `xl` / `size:large`). Issues with no size label rank after sized ones only when you are breaking a tie among otherwise equal items; do not skip a clearly higher-priority large ticket just because a small one exists at a lower priority.
5. Lowest issue number.

Explain the pick in one line before starting, including the issue number, title, and the main reason (for example priority label, due milestone, type, or lowest number). Then claim it.

If no eligible issue exists, stop and tell the user which open issues are blocked, waiting on input, assigned, or already in a PR. Do not start a random ticket.

If the user passed an issue number:

- It must be open. If closed, stop and give the URL.
- If it has `blocked`, `wontfix`, or `question`, stop and say why.
- If it has `epic`, stop and name its first unchecked child that is eligible instead.
- If it already has an open PR, stop and give that PR URL. Do not open a second PR.
- If it is assigned to someone else, stop and ask.
- If dependencies are unmet, stop and name them.
- If it has a `needs-*` label or is missing facts the user must supply, continue to step 3, which grills the user on the open questions. What stays unanswered falls under the content rules there (structure and `TODO`s, draft PR).

As soon as the ticket is chosen, claim it so nobody else picks it up:

```bash
gh issue comment <N> --body "Picked up: planning and implementing this issue, then opening a PR."
gh issue edit <N> --add-assignee @me
```

If assign fails, the comment is enough. Claim before you write code.

## 3. Plan

Read the issue (title, body, acceptance criteria, labels, milestone, dependencies). If its Context section names an epic (`Epic: #N`), read the epic with `gh issue view N --comments`: its body is the spec (problem, scope, approach, open questions), and its Tickets list shows what neighbouring tickets cover, so stay out of their scope.

Discover repo conventions instead of assuming a stack. Read, when they exist:

- `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `AGENTS.md`, and files under `docs/`
- `.github/PULL_REQUEST_TEMPLATE.md` or `.github/PULL_REQUEST_TEMPLATE/`
- CI workflows under `.github/workflows/` (and similar CI config if present)
- The package manager and toolchains from lockfiles and manifests, for example: `pnpm-lock.yaml` (pnpm), `package-lock.json` (npm), `yarn.lock` (yarn), `bun.lock` or `bun.lockb` (bun), `Makefile` / `justfile`, `Cargo.toml` (cargo), `go.mod` (go), `pyproject.toml` / `poetry.lock` / `uv.lock` / `requirements.txt` / `Pipfile` (Python). Use whatever the repo actually has, including other ecosystems if those files are present.
- Scripts or targets named lint, typecheck, test, build, check, or similar, in package manifests, Makefiles, or CI steps. Prefer the commands the repo and CI already run. Do not invent a new toolchain.

Write a short plan covering approach, files to touch, out of scope, how you will verify, and risks. Post it as an issue comment. Reuse it in the PR body later.

Before writing the plan, grill the user (as `grilling.md` describes) if acceptance criteria are ambiguous, the ticket has `needs-info` questions (in its comments, often with a recommended answer), or it needs facts, sources, names, credentials, prices, or dashboard values only the user can supply. Look up anything the repo or the epic already answers instead of asking. When the frontier is empty and the user confirms:

- Edit the ticket body so the acceptance criteria say what was decided, and comment the decisions on the ticket. If a decision changes the spec, edit the epic too and comment what changed.
- Remove `needs-info` if no question is left (`gh issue edit <N> --remove-label needs-info`).
- Facts the user could not supply stay `TODO`s, under the content rules below.

Never put a secret or credential the user gives you into an issue, comment, or commit.

For content or docs tickets:

- Never invent facts, figures, URLs, quotes, or legal or product claims.
- Use only sources the user or the issue already provided.
- If those are missing, draft structure only, mark every gap `TODO`, open the PR as a draft, and do not mark the work as approved or ready to publish.

## 4. Build

Branch from the current base-branch tip: `<issue#>-<slug>` (short kebab-case title, for example `12-fix-login-timeout`).

Make small, focused commits. Follow the conventions you discovered in step 3 (language, formatter, test layout, commit style if the repo documents one).

Install and run the repo's own checks, using its package manager or build tool. Typical patterns, only when those files and scripts exist: install (for example `pnpm install`, `npm ci`, `cargo fetch`), then lint, typecheck, test, and build. If CI runs extra checks (schema validate, link check, format), run the same locally when you can. If this ticket is the one that adds a script or check, run what already exists and add what the ticket requires.

Fix until the checks are green. Do not open a PR with a known red local check that this change caused. Unattended runs are the one exception: a draft PR that names the failing check, as the contract says.

## 5. Open the PR

Use `gh pr create` against the detected base branch. Title: `<ticket title> (#N)` (the GitHub issue title).

Body must include:

- Summary
- Plan (from step 3)
- How verified (commands and results)
- Screenshots if UI changed, otherwise `N/A`
- The checklist from the repo PR template, if one exists, filled in honestly
- A `Closes #N` line so merge closes the ticket

If there is no PR template, still include the sections above, plus:

- No secrets, tokens, or private credentials committed
- Checks are green (or CI is not in the repo yet, and the local checks you ran are green)
- Any dashboard, DNS, secrets, or billing steps are written as instructions for the user

Fill checklist items you can honestly tick. Leave items that need the user's review or sign-off unchecked.

Open as a draft (`gh pr create --draft`) when facts are missing, `TODO`s remain, or the user still owes input. Otherwise open a ready PR.

Do not add reviewers unless asked. Do not merge. Do not push to the default branch.

## 6. Self-review and report

Review the PR diff against the issue acceptance criteria, stated scope, and the hard limits above. Post that review as a PR comment (`gh pr comment`) covering:

- What is met
- What is not met, or residual risk
- Anything the user must do (dashboard steps, review, missing facts)

Then tell the user the PR URL and a two-line status: ready for review, or draft and waiting on the user, plus any action needed from them.
