---
name: no-comments
description: Strip comments outside the keep list from a diff, in a fresh subagent that did not write the code, and offer to turn "do not remove" style constraints into types, tests, or lints. Use when the user wants to remove comments, clean up comments, strip narrating or AI comments, run a comment pass, or check a diff against the no-comments rule.
argument-hint: "[files or git range]"
compatibility: Claude Code with the Agent tool, and git. Run from the root of a git checkout.
---

# no-comments

Delete every comment in a diff that is not on the keep list, and turn comments that claim a constraint into something that enforces it. The rule, the keep list, claimed constraints, and suppressions are defined in `../../docs/no-comments.md`, relative to this skill's base directory. Read it once at the start. Do not restate it to the subagent: pass its absolute path.

Scope argument (may be empty): $ARGUMENTS

## Hard limits

- Edit only comments, except for an encoding the user approves in step 4.
- Do not commit, push, stash, or switch branches.
- Do not touch files outside the scope.
- Do not encode a claimed constraint (type, test, lint) before the user says yes.
- Write concisely. No em dashes. No emoji.

## 1. Scope

1. Files or a git range were given: use them.
2. Otherwise, the diff against the base branch, working tree and untracked files included. The base branch: `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`, else the `origin/HEAD` symbolic ref, else `main`. Use `git merge-base HEAD <base>` and `git diff <merge-base>`, plus `git ls-files --others --exclude-standard`.
3. In a diff, only comments on added or changed lines are in scope. A file given by name is in scope whole.

If the scope is empty, say so and stop.

Note the files that already had uncommitted changes, so the report can tell the user's edits from this pass's.

## 2. Comment pass

Spawn one fresh subagent (Agent tool, `general-purpose`). It must not be the agent that wrote the code. Give it:

- The absolute path of `../../docs/no-comments.md`, to read in full first.
- The scope from step 1: the files, and for a diff, the range and the changed line numbers.
- These instructions:
  - Edit only comments. Never change code, strings, or whitespace outside a comment.
  - Delete every in-scope comment that is not on the keep list. When unsure whether a keep applies, delete it.
  - Do not delete a comment that claims a constraint (`do not remove`, `IMPORTANT`, `do not change this wording`, `talk to X before changing`, and similar). Leave it for the caller.
  - Do not delete a lint or type suppression. Look up the rule it suppresses, and report it.
  - Report in exactly these lists:
    - Deleted: `file:line` and a few words each.
    - Kept: `file:line`, the keep-list item, and why it applies.
    - Claimed constraints: `file:line`, the claim, and the code it guards.
    - Suppressions: `file:line`, the rule, and whether it is style-only or catches bugs.
    - Reshape: each symbol whose deleted comment explained surprising behavior in our own code, with the rename, extract, type, or restructure that would make it obvious.

## 3. Check the pass

Read `git diff` for the scope.

- Revert any edit that is not to a comment.
- Restore a deleted comment only if it is clearly on the keep list. Say which item applies.
- Delete a kept comment whose stated reason does not match a keep-list item.
- Check that every claimed constraint and suppression in scope appears in the report.

## 4. Claimed constraints and suppressions

For each claimed constraint:

1. Check whether the claim is true today: read the code it guards and `git log -L` or `git log -S` for its history.
2. If it comes from something we cannot change (a vendor, platform, or protocol), keep it as a keep-list item.
3. Otherwise, propose the cheapest enforcement in scope: a type, a runtime check, a test, or a lint rule, with the exact change.

For each suppression of a rule that catches bugs, propose the code fix that lets the suppression go.

Show all proposals together and ask once which to apply. Wait.

- Yes: make the change, run the repo's relevant check (for example the test you added), then delete the comment or suppression.
- No: delete a claimed-constraint comment anyway and report the constraint as open work. Leave a suppression in place and report it as open work.

## 5. Report

Tell the user, briefly:

- The scope.
- Deleted: count, with `file:line` for each.
- Kept: each with its keep-list item.
- Restored or overridden in step 3, and any reverted non-comment edits.
- Encoded: each constraint or suppression fixed, and the check that proves it.
- Open: constraints and suppressions not encoded, and each reshape target.
- Nothing is committed. Review with `git diff`.
