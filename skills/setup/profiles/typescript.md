# JS/TS profile

For a repo with `package.json` at the root. `/spkstack:setup` follows this in step 4. Every change below goes into the step 5 plan; nothing is written before that approval, except the answers to the questions this profile asks.

Tested with oxlint 1.95, oxfmt 0.80, and oxlint-tsgolint 7.0. These tools move fast: before writing config, run `npx oxlint --help` and `npx oxfmt --help` after install and check that every flag below still exists. If one is gone, say so in the PR body instead of guessing a replacement.

## Package manager

From the lockfile at the root:

| Lockfile | Manager | Add dev deps | Run a script | CI install |
|---|---|---|---|---|
| `pnpm-lock.yaml` | pnpm | `pnpm add -D` | `pnpm <script>` | `pnpm install --frozen-lockfile` |
| `package-lock.json` | npm | `npm install -D` | `npm run <script>` | `npm ci` |
| `yarn.lock` | yarn | `yarn add -D` | `yarn <script>` | `yarn install --immutable` (Berry) or `yarn install --frozen-lockfile` (v1) |
| `bun.lock`, `bun.lockb` | bun | `bun add -d` | `bun run <script>` | `bun install --frozen-lockfile` |

If there is no lockfile, use the `packageManager` field in `package.json`. If that is missing too, use npm and say so in the plan. More than one lockfile: ask which.

## Dev dependencies

Install with the repo's manager, latest versions:

- `oxlint`
- `oxfmt`
- `oxlint-tsgolint`, for type-aware rules. Only when the repo has `tsconfig.json`.
- `typescript`, if not already a dependency and the repo has `tsconfig.json`.
- A test runner, only when the repo has none (see Test runner).

## Test runner

Use the one the repo has: `vitest` or `jest` in its dependencies or scripts. That choice names the oxlint test plugin below (`vitest` or `jest`).

If it has neither, propose `vitest` with a `test` script of `vitest run --passWithNoTests`, and ask. On no, leave out the `test` script, the test plugin, and the test step in CI, and say so in the plan.

## TypeScript

With `tsconfig.json`: the `typecheck` script is `tsc --noEmit` and type-aware linting is on.

Without one (plain JS): propose a `tsconfig.json` with `"allowJs": true`, `"checkJs": true`, `"strict": true`, `"noEmit": true`, and `"include"` set to the source folders, and ask. On no, leave out `typescript`, `oxlint-tsgolint`, `typeAware`, the `typecheck` script, and its CI step.

## `.oxlintrc.json`

Write it at the root. If one already exists, show it beside this one and ask: replace, or merge (add missing plugins, categories, and rules, keeping theirs).

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "unicorn", "oxc", "import", "vitest"],
  "jsPlugins": ["./lint/no-comments.js"],
  "categories": {
    "correctness": "error",
    "suspicious": "error",
    "perf": "error"
  },
  "options": {
    "typeAware": true
  },
  "rules": {
    "vitest/expect-expect": "error",
    "vitest/valid-expect": "error",
    "vitest/no-standalone-expect": "error",
    "vitest/no-conditional-expect": "error",
    "vitest/no-conditional-in-test": "error",
    "vitest/no-conditional-tests": "error",
    "vitest/no-focused-tests": "error",
    "vitest/no-disabled-tests": "error",
    "vitest/no-commented-out-tests": "error",
    "vitest/no-identical-title": "error",
    "vitest/valid-title": "error",
    "vitest/require-to-throw-message": "error",
    "spkstack/no-comments": "error"
  }
}
```

- `plugins` replaces oxlint's default set, so it lists the defaults (`typescript`, `unicorn`, `oxc`) too.
- For jest: write `jest` in `plugins` and `jest/` in each rule name, and drop `no-conditional-tests` (vitest only).
- No test runner: drop the test plugin and every test rule.
- No `tsconfig.json`: drop `options.typeAware`.

These rules map to [`../../../docs/tautological-tests.md`](../../../docs/tautological-tests.md): a test with no assertion, an `expect` that never runs or asserts nothing, or an assertion behind a branch passes whatever the code does. Focused, skipped, and commented-out tests hide failures. Lint cannot catch every tautological test. The rule block in `CLAUDE.md` covers the rest.

## Comment check

Copy [`typescript/no-comments.js`](typescript/no-comments.js), next to this file, to `lint/no-comments.js` in the repo, byte for byte. The config above loads it as an oxlint JS plugin, so `lint` fails on any comment outside the keep list in [`../../../docs/no-comments.md`](../../../docs/no-comments.md). That doc says which keep exceptions the check enforces and which stay review-only. If `lint/no-comments.js` already exists with other content, show the diff and ask.

oxlint marks JS plugins as alpha. If `jsPlugins` is missing from `node_modules/oxlint/configuration_schema.json`, leave the plugin and its rule out, and say so in the PR body.

On an existing codebase this check will fail on every comment already there. That is expected: report it, and point to `/spkstack:no-comments` to clear them in a separate PR.

## `.oxfmtrc.json`

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json"
}
```

oxfmt defaults to a print width of 100. When Prettier is being replaced, `npx oxfmt --migrate=prettier` writes this file from the Prettier config instead; run it before removing Prettier's config.

## ESLint and Prettier

Look for `eslint.config.*`, `.eslintrc*`, an `eslintConfig` key in `package.json`, `.prettierrc*`, `prettier.config.*`, a `prettier` key in `package.json`, and their packages (`eslint`, `prettier`, `eslint-*`, `@typescript-eslint/*`, `prettier-plugin-*`).

If any exist, ask once per tool: replace it (recommended), or keep it and add oxlint and oxfmt beside it.

- Replace ESLint, flat config: run `npx @oxlint/migrate` to seed `.oxlintrc.json` with the repo's existing rules, then merge in the config above. Legacy `.eslintrc*`: say it is not migrated, and use the config above as is.
- Replace Prettier: `npx oxfmt --migrate=prettier` first, as above.
- On replace, remove the tool's config files, its `package.json` key, its packages, and any script or CI step that runs it. Only on a yes.
- On keep: leave them untouched, and add the oxlint and oxfmt scripts under the names below only where they are free.

## Scripts

Add to `package.json`:

| Script | Command |
|---|---|
| `lint` | `oxlint --deny-warnings` |
| `format` | `oxfmt` |
| `format:check` | `oxfmt --check` |
| `typecheck` | `tsc --noEmit` |
| `test` | the repo's runner (`vitest run`, `jest`), or `vitest run --passWithNoTests` when vitest was added |
| `test:mutation` | `stryker run` (see Mutation testing) |

If a script with that name already exists with a different command, show both and ask: replace, keep theirs, or keep theirs and add ours under another name (for example `lint:ox`). Never overwrite one silently. Keeping theirs means `### Checks` and CI use their script.

## CI

If a workflow under `.github/workflows/` already installs dependencies and runs some of these scripts on `pull_request`, add only the missing steps to that job and show the diff. Otherwise write `.github/workflows/spkstack-checks.yml`:

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
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v7
        with:
          node-version-file: <.nvmrc | .node-version | package.json>
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm typecheck
      - run: pnpm test
```

- `<base>` is the base branch.
- `node-version-file`: `.nvmrc` or `.node-version` if present, else `package.json` when it has `engines.node`. Otherwise drop it and use `node-version: lts/*`.
- `pnpm/action-setup` reads the version from `packageManager`. If that field is missing, add `with: version: <the local pnpm --version>`.
- npm: drop `pnpm/action-setup`, use `cache: npm`, and the npm commands from the table. yarn: `cache: yarn`. bun: replace both setup steps with `oven-sh/setup-bun@v2`.
- Drop any step whose script was left out above.

Before writing, check the latest major of each action with `gh api repos/<owner>/<action>/releases/latest --jq .tag_name` and use it.

## Mutation testing

Lint catches hollow tests by shape. Mutation testing catches the rest of [`../../../docs/tautological-tests.md`](../../../docs/tautological-tests.md): StrykerJS changes the code under test, and a mutant that survives means no test noticed. Only with a test runner: skip this section when the repo has none.

Tested with StrykerJS 10.1.1 and vitest 5.1. A full run on the skeleton (17 mutants) takes about 2 seconds. Larger codebases take minutes to hours, which is why CI mutates only the files a PR changes.

**Dev deps**: `@stryker-mutator/core` and the runner plugin for the repo's test runner: `@stryker-mutator/vitest-runner` (`testRunner: "vitest"`) or `@stryker-mutator/jest-runner` (`testRunner: "jest"`).

**`stryker.config.json`**:

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "testRunner": "vitest",
  "plugins": ["@stryker-mutator/vitest-runner"],
  "coverageAnalysis": "perTest",
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"],
  "reporters": ["clear-text", "progress", "html"],
  "thresholds": { "high": 80, "low": 60, "break": null },
  "tsconfigFile": "stryker-skips-tsconfig-rewrite"
}
```

- `plugins` names the runner because Stryker does not find plugins on its own under pnpm's layout.
- `mutate` is the source folders, not the tests. Change `src` to where the repo's code lives.
- `thresholds.break` is `null`: report-only, so the score never fails a run. This follows the epic's open question on blocking versus report-only. Once it is answered, set `break` to the agreed score.
- `tsconfigFile` names a file that does not exist on purpose. StrykerJS 10.1 rewrites `tsconfig.json` with the TypeScript 6 JS API, which TypeScript 7 removed (https://github.com/stryker-mutator/stryker-js/issues/6111), and the run crashes with `ts.parseConfigFileTextToJson is not a function`. A missing file skips that rewrite. The rewrite only matters when `tsconfig.json` extends or references files outside the repo, so in a single-package repo nothing is lost. With TypeScript 6 or older, leave the key out. Remove it once a StrykerJS release fixes that issue.

**`.gitignore`**: add `reports` and `.stryker-tmp`, which also keeps them out of lint and format.

**Script**: `test:mutation`: `stryker run`. Same conflict rule as the other scripts.

**CI**: add a second job to the workflow:

```yaml
  mutation:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v7
        with:
          node-version-file: <same as the checks job>
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: changed source files
        id: changed
        env:
          BASE_REF: ${{ github.base_ref }}
        run: |
          files=$(git diff --name-only --diff-filter=AMR "origin/$BASE_REF...HEAD" -- ':(glob)src/**/*.ts' ':(glob,exclude)src/**/*.test.ts' | paste -sd, -)
          echo "files=$files" >> "$GITHUB_OUTPUT"
      - if: steps.changed.outputs.files != ''
        env:
          FILES: ${{ steps.changed.outputs.files }}
        run: pnpm test:mutation --mutate "$FILES"
      - if: steps.changed.outputs.files != ''
        uses: actions/upload-artifact@v7
        with:
          name: mutation-report
          path: reports/mutation/
```

- StrykerJS has no changed-files mode, so the job diffs the PR against its base and passes the changed source files to `--mutate`. With none, it skips the run.
- Keep the two pathspecs in step with `mutate` in the config.
- File names reach the shell through `env`, never `${{ }}` inside `run`, so a crafted file name cannot inject commands.
- Adapt the setup steps for npm, yarn, or bun as in the checks job.

`test:mutation` is not part of `### Checks`: it is slow, and it is report-only.

## Checks

The `### Checks` line, in the repo's manager, with only the scripts that exist:

```
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test
```

## Run

After install and writing files, run `format` once so `format:check` is green on files this PR wrote. Run it on the rest of the repo only if the user says yes: it can touch every file. Then run each script in `### Checks`. On an existing codebase red lint or typecheck is expected: report it, do not fix the code in this PR. Then run `test:mutation` once and put its mutation score in the PR body. It is report-only, so a low score does not make the PR a draft.
