# No comments

The no-comments rule, defined once. Adapted from pstack's `no-comments` skill and its Comment Sicko agent. `/spkstack:setup` writes the rule block below into a target repo's `CLAUDE.md`. `/spkstack:no-comments` applies the keep list to a diff and deletes every other comment. Change this file first when the rule changes, then update both skills.

## Rule block

Paste this into the `## spkstack` section of a repo's `CLAUDE.md`:

```markdown
### No comments

Code says what it does through names, types, and structure. Do not write comments, except these:

- License or legal headers.
- Doc comments that define a public API contract.
- Behavior forced by an external dependency, platform, vendor, or protocol we cannot change.
- Issue or RFC links that explain a constraint the code cannot express.
- Lint or formatter pragmas whose rule is style-only.

No narration, banners, section dividers, commented-out code, or workaround explanations. If code needs a comment to be understood, rename, extract, or retype it instead. A comment that claims a constraint ("do not remove", "IMPORTANT") becomes a type, test, or lint rule where possible, and is then deleted.
```

## Keep list

A comment survives only if it is one of these. When it is unclear whether a comment qualifies, delete it.

| Keep | Example | Not a keep |
|---|---|---|
| License or legal header | SPDX line, copyright notice | Author or date banners |
| Doc comment that defines a public API contract | JSDoc, docstring, or rustdoc on an exported function: parameters, return value, errors, guarantees | Doc comments on private helpers, or ones that restate the signature |
| Behavior forced by something we cannot change | A vendor API that returns 200 on failure, a platform bug, a protocol quirk | Surprising behavior in our own code |
| Issue or RFC link explaining a constraint code cannot express | `See RFC 7231 section 6.5.1` next to the code it governs | A link used as a TODO or a to-read note |
| Lint or formatter pragma whose rule is style-only | `prettier-ignore` on a hand-aligned table, disabling a line-length or naming-style rule | A suppression of a rule that catches bugs |

Surprising behavior in our own code is not a keep. Delete the comment and change the code so the behavior is obvious without it: rename, extract, add a type, or restructure. If that change is out of scope, report the symbol as open work.

## Claimed constraints

Comments like `do not remove`, `do not change this wording`, `IMPORTANT`, or `talk to X before changing` claim a constraint without enforcing it.

1. Check whether the claim is true today. Read the nearby code and the history of the symbol it names.
2. If the constraint comes from something we cannot change, it may stay as a keep.
3. Otherwise, replace the claim with the cheapest enforcement in scope: a type, a runtime check, a test, or a lint rule. Then delete the comment.
4. If no enforcement fits in scope, delete the comment anyway and report the constraint as open work.

A long justification without a keep-list reason does not earn a keep.

## Suppressions

`eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `# noqa`, `#[allow(...)]`, `//nolint`, and similar are comments too. Look up the rule each one suppresses:

- Style-only, pedantic, or a known false positive: keep.
- Catches real bugs or protects correctness or safety: delete the suppression and fix the code it was hiding.

## Who reads this

- `/spkstack:setup`: writes the rule block into a target repo's `CLAUDE.md`.
- `/spkstack:no-comments`: deletes comments outside the keep list in a diff, and handles claimed constraints and suppressions as above.
