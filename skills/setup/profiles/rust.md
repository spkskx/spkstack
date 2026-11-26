# Rust profile

For a repo with `Cargo.toml` at the root. `/spkstack:setup` follows this in step 4. Every change below goes into the step 5 plan; nothing is written before that approval, except the answers to the questions this profile asks.

Tested with Rust 1.99 stable, clippy 0.1.99, and rustfmt 1.10.

## Tools

`rustfmt` and `clippy` are rustup components. If `cargo fmt --version` or `cargo clippy --version` fails, say so in the plan and give `rustup component add rustfmt clippy` instead of running it. CI installs both through the toolchain action.

## Lints in `Cargo.toml`

Add a `[lints]` table, so the same lints run locally, in CI, and in editors:

```toml
[lints.clippy]
pedantic = { level = "warn", priority = -1 }
missing_errors_doc = "allow"
missing_panics_doc = "allow"
```

- `pedantic` at `warn`, with `-D warnings` in the clippy command, makes every pedantic lint an error. `priority = -1` lets single lints below override the group.
- `missing_errors_doc` and `missing_panics_doc` are allowed: they demand doc comments that [`../../../docs/no-comments.md`](../../../docs/no-comments.md) forbids. Do not enable `missing_docs` for the same reason.
- A workspace: put the table under `[workspace.lints.clippy]` in the root `Cargo.toml`, and add `[lints] workspace = true` to each member that lacks it. Say so in the plan.
- An existing `[lints]` or `[workspace.lints]` table, or `#![warn(clippy::...)]` / `#![deny(clippy::...)]` attributes in `lib.rs` or `main.rs`: show them and ask: add the missing keys, or keep theirs.
- On an existing codebase pedantic can produce many errors. Say so in the plan, and offer the table without `pedantic` as the alternative.

No clippy lint catches a test that asserts nothing. The rule block from [`../../../docs/tautological-tests.md`](../../../docs/tautological-tests.md) covers that.

## rustfmt

Use rustfmt's defaults. Do not write `rustfmt.toml`. If the repo has one, keep it.

## CI

If a workflow under `.github/workflows/` already runs some of these on `pull_request`, add only the missing steps to that job and show the diff. Otherwise write `.github/workflows/spkstack-checks.yml`:

```yaml
name: checks

on:
  pull_request:
  push:
    branches: [<base>]

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy
      - uses: Swatinem/rust-cache@v2
      - run: cargo fmt --all --check
      - run: cargo clippy --all-targets --all-features -- -D warnings
      - run: cargo test --all-features
```

- `<base>` is the base branch.
- If the repo has `rust-toolchain.toml` or `rust-toolchain`, use `dtolnay/rust-toolchain@master` with `toolchain:` set to the pinned channel.
- `--all-targets` lints tests, examples, and benches too. Drop `--all-features` when features cannot be built together, and say so.
- Before writing, check the latest major of `actions/checkout` and `Swatinem/rust-cache` with `gh api repos/<owner>/<action>/releases/latest --jq .tag_name` and use it. `dtolnay/rust-toolchain` is referenced by channel, not version.

## Checks

The `### Checks` line:

```
cargo fmt --all --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test --all-features
```

## Run

Run each command in `### Checks`. If `cargo fmt --all --check` fails, run `cargo fmt --all` only if the user says yes: it can touch every file. On an existing codebase red clippy is expected: report it, do not fix the code in this PR.
