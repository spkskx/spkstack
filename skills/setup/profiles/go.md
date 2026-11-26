# Go profile

For a repo with `go.mod` at the root. `/spkstack:setup` follows this in step 4. Every change below goes into the step 5 plan; nothing is written before that approval, except the answers to the questions this profile asks.

Tested with Go 1.26 and golangci-lint 2.15. The config is golangci-lint v2 format (`version: "2"`); v1 configs do not load in v2.

## Tools

- `gofmt` and `go vet` ship with Go. Nothing to install.
- golangci-lint v2, for the local run. If `golangci-lint version` is missing or below v2, say so in the plan and give the install command from https://golangci-lint.run/docs/welcome/install/ instead of running it. CI installs it through its action, so the repo needs no tools file.

## `.golangci.yml`

Write it at the root. If a golangci-lint config already exists (`.golangci.yml`, `.golangci.yaml`, `.golangci.toml`, `.golangci.json`), show it beside this one and ask: replace, or merge (add missing linters and formatters, keeping theirs). A v1 config: offer `golangci-lint migrate` first, then merge.

```yaml
version: "2"

linters:
  default: standard
  enable:
    - bodyclose
    - contextcheck
    - durationcheck
    - errname
    - errorlint
    - exhaustive
    - gocritic
    - gosec
    - misspell
    - nilerr
    - noctx
    - nolintlint
    - perfsprint
    - revive
    - rowserrcheck
    - sqlclosecheck
    - testifylint
    - thelper
    - tparallel
    - unconvert
    - unparam
    - usestdlibvars
    - usetesting
  settings:
    nolintlint:
      require-explanation: true
      require-specific: true
    revive:
      rules:
        - name: exported
          disabled: true
        - name: package-comments
          disabled: true

formatters:
  enable:
    - gofmt
    - goimports
```

- `standard` is errcheck, govet, ineffassign, staticcheck, and unused. The list adds bug finders (error wrapping, HTTP bodies, SQL rows, contexts, security), not style.
- revive's `exported` and `package-comments` are off, and comment linters such as `godot` and `godox` are left out: they demand comments that [`../../../docs/no-comments.md`](../../../docs/no-comments.md) forbids.
- `nolintlint` makes every `//nolint` name its linter and say why, as the suppression rule in that doc requires.
- `testifylint`, `thelper`, `tparallel`, and `usetesting` catch misused test helpers. No Go linter catches a test that asserts nothing; the rule block from [`../../../docs/tautological-tests.md`](../../../docs/tautological-tests.md) covers that.

Run `golangci-lint config verify` after writing it.

## Make targets

If the repo has a `Makefile` or `justfile` with targets for format, vet, lint, or test, reuse them in `### Checks` and CI. Do not add a Makefile when there is none.

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
      - uses: actions/setup-go@v7
        with:
          go-version-file: go.mod
      - name: gofmt
        run: |
          files=$(gofmt -l .)
          if [ -n "$files" ]; then echo "$files"; exit 1; fi
      - run: go vet ./...
      - uses: golangci/golangci-lint-action@v9
        with:
          version: v2.15
      - run: go test ./...
```

- `<base>` is the base branch.
- Use the golangci-lint version the run tested with locally, as `v<major>.<minor>`.
- Before writing, check the latest major of each action with `gh api repos/<owner>/<action>/releases/latest --jq .tag_name` and use it.

## Checks

The `### Checks` line:

```
test -z "$(gofmt -l .)" && go vet ./... && golangci-lint run && go test ./...
```

## Run

Run `golangci-lint config verify`, then each command in `### Checks`. If `gofmt -l .` lists files, run `gofmt -w` on them only if the user says yes: it can touch every file. On an existing codebase red vet or lint is expected: report it, do not fix the code in this PR.
