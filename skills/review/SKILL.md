---
name: review
description: Review a GitHub pull request against the acceptance criteria of the ticket it closes, flag work outside the ticket's scope and tests that would pass with the behavior broken, and post one review comment. Use when the user wants to review a PR, check a PR against its ticket, see if a PR does what the issue asked, check a PR's tests for tautological tests, or check the PRs that /spkstack:next opened.
argument-hint: "[pr-number-or-url]"
compatibility: Requires git and the GitHub CLI (gh). Run from a local clone of a GitHub repository, or pass a PR URL.
---

# review

Check one pull request against the ticket it closes: does it meet each acceptance criterion, does it stay in scope, and can its tests fail? Post the result as one PR comment. GitHub only, via `gh`.

Tickets and epics follow the spkstack ticket contract: `../../docs/ticket-contract.md`, relative to this skill's base directory. Read it once at the start. PRs whose ticket does not follow it can still be reviewed, as long as the ticket has checkable criteria.

Tests are judged against `../../docs/tautological-tests.md` (same base): its two-edit check and its list of common causes. Read it once at the start. Do not restate it in the comment; name the cause and link the doc.

PR argument (may be empty): $ARGUMENTS

This is a ticket review, not a code review. For bugs and security, suggest `/code-review` and `/security-review`.

## Hard limits

- Read-only except for one PR comment, posted only after the user says yes.
- Do not approve, request changes, merge, close, push, or edit the PR, the ticket, or the epic.
- Do not check out the PR branch or change the working tree.
- Do not hunt for bugs or style issues. Judge the criteria, the scope, and whether the PR's tests can fail.
- Do not rewrite or suggest replacement tests. Name the problem; fixing it is the author's job.
- Every verdict cites evidence: a file and line, a test, or a command and its output. No evidence means `unclear`, not `met`.
- Write concisely. No em dashes. No emoji.

## 1. Find the PR

1. The repo: from a PR URL if given, otherwise `origin` in the current checkout (parse `owner/repo`). `gh auth status` must succeed.
2. The PR:
   - A number or URL was given: use it.
   - None: `gh pr view --json number` for the current branch. If there is none, list open PRs (`gh pr list --json number,title,headRefName`) and ask which.
3. `gh pr view <P> --json number,title,url,state,isDraft,body,headRefName,baseRefName,files,closingIssuesReferences`.

## 2. Find the ticket and the epic

1. The ticket: the PR's `closingIssuesReferences`. If empty, a `Closes`, `Fixes`, or `Resolves #N` line in the PR body. If there is still none, or more than one, stop and say so: name the candidates and ask which.
2. `gh issue view <N> --json number,title,body,labels,url`. Take its Acceptance criteria and Out of scope sections. If it has no acceptance criteria, stop and say the ticket cannot be reviewed this way; suggest `/code-review`.
3. The epic: the ticket's `Epic: #<E>` line. If present, `gh issue view <E>` and take its Out of scope section and its Tickets list (so work that belongs to a sibling ticket can be named).

## 3. Read the change

- `gh pr diff <P>` for the full diff. For a large diff, start from `files` and read the parts each criterion needs.
- When the diff is not enough (a criterion depends on code the PR did not touch), read those files at the PR head: `gh api repos/OWNER/REPO/contents/<path>?ref=<headRefName>`.
- List every test the diff adds or changes: the file and the test name (`it`, `test`, `def test_`, `#[test]`, `func Test`, and similar). For each, read the code under test too, from the diff or at the PR head.
- Read the PR body's "How verified" section and `gh pr checks <P>`. Claims there count as evidence only when they name a command and its result.

## 4. Judge

For each acceptance criterion, in the ticket's order, give one verdict:

- **met**: the diff or a named check shows it. Cite it.
- **not met**: the diff contradicts it or leaves it out. Say what is missing.
- **unclear**: it cannot be shown from the diff and checks (for example, it needs a live run). Say what would show it.

Then check scope:

- Changes that serve no criterion or the ticket's goal.
- Changes that hit the ticket's or the epic's Out of scope, or that belong to a sibling ticket in the epic's Tickets list (name it).
- Version bumps, README entries, and similar housekeeping the repo's CLAUDE.md or contributing docs require are in scope.

Then check each test from step 3 with the doc's first edit: break the behavior the test name claims (a wrong value, a skipped effect, an effect done twice). Would the test still pass?

- **Yes**: flag it. Name the file, the test, the cause from the doc's list, and the edit that would leave it green, for example `total() returns 0` or `charge() is never called`.
- **No, or it depends on code you cannot see**: do not flag it. Flag only what you can show.

Also flag a test that fails the doc's second edit (pinned to internals) only when the cause is plain from the diff, such as an assertion on a private helper's call. List tests with no finding as a count, not one by one.

## 5. Post

Show the review to the user in this shape, then ask whether to post it:

```markdown
## review

Ticket: #<N> <title>

| Criterion | Verdict | Evidence |
|---|---|---|
| <criterion, shortened> | met | `path/to/file:42` |
| ... | not met | <what is missing> |

Scope: <in scope, or each change outside it and why>

### Tautological tests

Checked against [tautological-tests.md](https://github.com/spkskx/spkstack/blob/main/docs/tautological-tests.md): <N> tests added or changed.

| Test | Cause | Still passes when |
|---|---|---|
| `path/to/file.test.ts` > `adds tax` | expected value computed by the code under test | `total()` returns any number |

<or: None found.>

Result: <all met | N not met | N unclear>, <N tautological tests | no tautological tests>. For bugs and security, run `/code-review`.
```

On yes, write it to a temp file (`mktemp`) and run `gh pr comment <P> --body-file <file>`. Post one comment per run. If posting fails, show the error and do not retry.

## 6. Report

Tell the user, briefly:

- The PR URL and the ticket it was checked against.
- The result line, and each `not met` or `unclear` criterion.
- Any scope findings.
- Each tautological test flagged, with its cause.
- Whether the comment was posted (with its URL).
