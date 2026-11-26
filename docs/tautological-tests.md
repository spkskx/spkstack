# Tautological tests

The no-tautological-tests rule, defined once. Adapted from pstack's `principle-test-behavior-not-implementation` skill. `/spkstack:setup` writes the rule block below into a target repo's `CLAUDE.md`. `/spkstack:review` checks the tests in a PR against it. Change this file first when the rule changes, then update both skills.

## Rule block

Paste this into the `## spkstack` section of a repo's `CLAUDE.md`:

```markdown
### No tautological tests

A test must fail when the behavior it claims to test is broken. Check every test you write or keep with two edits:

1. Break the behavior: return a wrong value, skip an effect, or do it twice. The test must fail.
2. Change only the internals, keeping every observable result the same. The test must still pass.

Drive the code through its public interface with a concrete input. Derive the expected value from the requirement, never from a run of the code. Assert what the contract promises, no less and no more. Do not compute the expected value with the code under test, assert on data the test built itself, restate a constant without running the code that reads it, or assert that a mock returns what it was configured to return. Delete a test that cannot fail.
```

## Definition

A tautological test keeps passing when the behavior it claims to test is broken.

It matters because it gives a false sense of security. The suite is green, coverage looks good, and a reviewer reads the test name as proof that the behavior works. None of that is true, and nobody finds out until the bug reaches a user.

Behavior is what the code's users can observe through the interface they use: return values, errors, state they can read back, and effects outside the code, such as a request sent, a row written, or a message emitted. Implementation is what they cannot observe: private helpers, internal call order, intermediate data.

## The two-edit check

Judge each test against two imagined edits.

| Edit | The test must | If it does not |
|---|---|---|
| Break the behavior: return a wrong value, skip an effect, or do the effect twice | Fail | It is tautological. It proves nothing. |
| Change only the internals: restructure the code and keep every observable result the same | Still pass | It is pinned to the implementation. It breaks on every refactor and still catches no bug. |

Keep a test that catches the first edit and survives the second. Rewrite or delete the rest.

## Common causes

- **Expected value computed by the code under test.** `expect(total(cart)).toBe(total(cart))`, or a snapshot recorded from the current output and never checked against the requirement.
- **Assertions on data the test built itself.** The test builds an object, passes it through, and asserts on its own copy instead of on what the code returned.
- **Assertions looser than the contract.** `toBeDefined()`, `toBeTruthy()`, or "the list is not empty" when the contract promises a specific value.
- **Restated constants.** The test repeats a constant or prompt string but never runs the code that reads it, so the code can change and the test still passes.
- **Mocks asserted to return what they were configured to return.** The mock is set up to return `x`, and the test asserts it got `x`, without the code under test doing anything in between.

## What to do instead

- Drive the code through its public interface, the one its users call, with a concrete input.
- Derive the expected value from the requirement, not from a run of the code.
- Assert exactly what the contract promises. An exact error message pins wording no caller reads; the error type callers branch on is the contract.
- When the contract is that something does not happen ("an empty cart never charges"), pair the test with a case where it does, so the test shows it can see it.
- The payload a mocked external service receives is behavior, because that service observes it. A call to an internal helper is implementation.
- Delete tests that cannot fail. A missing test is honest. A hollow one is not.

## Who reads this

- `/spkstack:setup`: writes the rule block into a target repo's `CLAUDE.md`.
- `/spkstack:review`: flags tests in a PR that fail the two-edit check or match a common cause.

## What enforces it

The rule is mostly judgment. Two checks enforce part of it in CI:

- **Test lint rules**, for example oxlint's test rules in a JS/TS repo, catch hollow shapes such as tests with no assertions.
- **Mutation testing**, for example StrykerJS in a JS/TS repo, runs the first edit for real: it breaks the code in small ways and reports every change that no test catches.
