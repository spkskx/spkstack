---
name: setup
description: Set up a GitHub repo for deterministic AI development. Writes a spkstack section into the repo's CLAUDE.md (no comments, no tautological tests), proposes the language's formatter and strictest linter, and lands it all as one PR after one approval. Use when the user says set up this repo, setup spkstack, add spkstack rules, add my taste rules to CLAUDE.md, or wants strict lint and format checks in a new or existing repo.
argument-hint: "(no arguments)"
compatibility: Requires git and the GitHub CLI (gh). Run from the root of a local clone of a GitHub repository.
---

# setup

Give a repo the checks and rules that make AI-written code match the user's taste, so results depend on checks that fail, not on an agent remembering preferences. Writes one `## spkstack` section into the repo's `CLAUDE.md`, plus language tooling when a profile exists, and opens one PR. GitHub only, via `gh`. Re-runnable: it owns only its own section and never duplicates it.

The rules it writes are defined once, relative to this skill's base directory:

- `../../docs/no-comments.md`
- `../../docs/tautological-tests.md`

Read both at the start of a run and take each file's `## Rule block` as written.

## Hard limits

- Do nothing outward-facing (branch, commit, push, PR) before the user approves the planned changes in step 5.
- Do not merge. Do not push to the default branch, except a first commit on an empty repo after the user says yes (step 1).
- In `CLAUDE.md`, change only the `## spkstack` section. Leave every other line as it is.
- Do not write tooling config, scripts, or CI for a language with no profile until the user says yes to the proposal in step 4.
- Do not touch global `~/.claude` files, Claude Code hooks, or git hooks.
- Write concisely. No em dashes. No emoji.

## 1. Preflight

Run from the repository root.

1. `git rev-parse --show-toplevel` succeeds, and `origin` is a GitHub remote. Parse `owner/repo` from it.
2. `gh auth status` succeeds with write access to the repo.
3. `git status` is clean. If not, stop and say so. Do not stash, commit, or discard.
4. The base branch: `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`. Then `git fetch origin`.
5. If the base branch does not exist on the remote (empty repo), a PR has no base. Ask the user to choose:
   - A. Push a minimal `README.md` as the first commit on `origin/<base>` (you do it only after the user says yes), then continue with a PR.
   - B. Stop.
6. If `origin` already has a branch `spkstack-setup`, or an open PR comes from it, stop and give that PR's URL. Do not open a second one.

If any check fails, stop and say which.

## 2. Detect

From the repository root, without changing anything:

1. **Language**, from manifests at the root:

   | Manifest | Language | Profile |
   |---|---|---|
   | `package.json`, `tsconfig.json` | JS/TS | `profiles/js-ts.md` |
   | `pyproject.toml`, `requirements.txt`, `setup.py` | Python | `profiles/python.md` |
   | `go.mod` | Go | `profiles/go.md` |
   | `Cargo.toml` | Rust | `profiles/rust.md` |

   Profiles live under this skill's base directory. Another manifest (for example `Gemfile`, `pom.xml`, `mix.exs`): name the language from it. Manifests for more than one language at the root: say monorepo setup is not supported, and offer the `CLAUDE.md` section only.
2. **Empty**: no files besides `README*`, `LICENSE*`, and `.gitignore`. An empty repo gets the `CLAUDE.md` section only. Do not scaffold a project.
3. **Existing tooling**: the formatter, linter, type checker, and test runner already configured, from config files, manifest scripts, and `.github/workflows/`.
4. **Existing section**: whether `CLAUDE.md` exists and has a line that is exactly `## spkstack`. The section runs from that line to the line before the next line starting with `## `, or to the end of the file.

## 3. The section

If the section exists, show it and ask once:

- **Reconfigure**: build it fresh as below and replace the old one.
- **Edit**: ask what to change, and apply only that to the current section.
- **Keep**: leave it as it is. Go on to step 4 for tooling only. If there is no tooling to add either, stop: nothing to do.

To build it fresh, inline the rule blocks so the repo needs no copy of spkstack:

```markdown
## spkstack

Written by `/spkstack:setup`. Re-run it to change this section.

<rule block from ../../docs/no-comments.md>

<rule block from ../../docs/tautological-tests.md>

### Checks

Run before every PR: <the commands from step 4, for example `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test`>
```

Leave out `### Checks` when step 4 adds no commands and the repo has none.

Placement: replace the old section in place. With no section, append it to the end of `CLAUDE.md`. With no `CLAUDE.md`, create it with `# <repo name>` and the section.

## 4. Tooling

- **A profile exists** for the language: follow it. A profile lists the tools, the config files to write, the manifest scripts to add, the CI workflow, and the commands for `### Checks`. Where it conflicts with tooling the repo already has, it says what to do; if it does not, ask.
- **No profile**: propose the language's standard formatter and its strictest widely used linter, with the config files, scripts, and CI step you would add. Ask once. On yes, include them in the plan for step 5. On no, write the `CLAUDE.md` section only.
- **Empty repo or monorepo**: no tooling.

When the repo already runs checks, reuse its commands in `### Checks` instead of inventing new ones.

## 5. Approve and open the PR

Show the plan:

- Each file to create or change, with the full new `## spkstack` section and a short summary of every other change.
- The branch `spkstack-setup`, one commit, a push, and a PR against the base branch.

Ask once and wait. If the user wants changes, apply them, show the plan again, and ask again.

On yes:

1. `git checkout -b spkstack-setup` from the up-to-date base branch.
2. Write the files. Run every command that `### Checks` lists, and the install step first if tooling was added. A red check from the new tooling is expected on an existing codebase: do not fix the codebase in this PR. Say which checks fail in the PR body.
3. Commit, `git push -u origin spkstack-setup`, and `gh pr create` against the base branch. Title: `Set up spkstack rules` or `Set up spkstack rules and <language> checks`. Body: what was added and why, the checks run and their results, any failing check and the command that shows it, and anything the user must do by hand. Open as a draft when a check is red.
4. Check out the base branch again.

Never merge.

## 6. Report

Tell the user, briefly:

- The PR URL, and whether it is ready or a draft and why.
- What the section holds, and which tooling was added or proposed and declined.
- Any check that fails, with the command that shows it.
- Next: review and merge the PR. Re-run `/spkstack:setup` to change the section later.
