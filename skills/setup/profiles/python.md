# Python profile

For a repo with `pyproject.toml` at the root. `/spkstack:setup` follows this in step 4. Every change below goes into the step 5 plan; nothing is written before that approval, except the answers to the questions this profile asks.

Tested with uv 0.12, ruff 0.17.6, Pyright 1.1.414, and pytest 9.2.

## Package manager

uv. Dev dependencies go in the `dev` dependency group with `uv add --dev`, every command runs through `uv run`, and `uv.lock` is committed.

- No `uv.lock` and no other lockfile: the first `uv add` creates it. Say so in the plan.
- Another manager's lockfile (`poetry.lock`, `pdm.lock`, `Pipfile.lock`): say this profile needs uv, and ask: switch to uv (`uv.lock` replaces theirs, and the plan lists the files that change), or the `CLAUDE.md` section only.
- `requirements.txt` or `setup.py` but no `pyproject.toml`: ask: add a `pyproject.toml` with `uv init --bare` and move the requirements in with `uv add -r requirements.txt`, or the `CLAUDE.md` section only.

If `uv --version` fails, say so in the plan and give the install command from https://docs.astral.sh/uv/getting-started/installation/ instead of running it. CI installs uv through its action.

## Dev dependencies

```
uv add --dev 'ruff==<version>' 'pyright[nodejs]==<version>' pytest
```

- Use the latest version of each, from `https://pypi.org/pypi/<name>/json`. Pin ruff and Pyright exactly: `select = ["ALL"]` picks up new rules on every ruff release, and Pyright's diagnostics change between releases, so an unpinned upgrade can turn CI red with no code change.
- The `nodejs` extra bundles Node through `nodejs-wheel-binaries`. Pyright runs on Node, and without the extra it downloads Node on first run.
- pytest only when the repo has no test runner. If it uses another one (`unittest`, `nose2`, a `tox` or `nox` session), keep it and use its command in `### Checks` and CI.

## Existing tools

If the repo configures black, isort, flake8, pylint, or mypy (in `pyproject.toml`, `setup.cfg`, `tox.ini`, `.flake8`, `mypy.ini`, `.pylintrc`, or `.pre-commit-config.yaml`), list them and ask: replace them with ruff and Pyright (recommended: remove their config and dev dependencies), or keep them next to the new tools.

## ruff in `pyproject.toml`

```toml
[tool.ruff.lint]
select = ["ALL"]
ignore = [
  "D",
  "COM812",
  "CPY",
  "TD",
]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101", "PLR2004", "INP001"]
```

- `ALL` turns on every rule, including bug finders (`B`, `S`, `PL`), pytest style (`PT`), and annotations (`ANN`). The ignores are only rules that conflict with something else:
  - `D` (pydocstyle) demands docstrings everywhere, which [`../../../docs/no-comments.md`](../../../docs/no-comments.md) forbids.
  - `COM812` conflicts with ruff format, and ruff warns about it.
  - `CPY` requires a copyright header in every file.
  - `TD` sets the format of TODO comments. `FIX` stays on and flags every TODO, because a TODO is not on the no-comments keep list.
- `ERA001` (commented-out code), `PGH003` (bare `# type: ignore`), `PGH004` (bare `# noqa`), and `RUF100` (unused `# noqa`) stay on: they make every suppression name its rule, as the suppression rule in that doc requires.
- Tests: `S101` allows `assert`, `PLR2004` allows literal expected values, and `INP001` allows a `tests/` folder without `__init__.py`. Change the glob if the tests live elsewhere.
- ruff format uses its defaults. Do not add a `[tool.ruff.format]` table.

If a ruff config already exists (`[tool.ruff]` in `pyproject.toml`, `ruff.toml`, or `.ruff.toml`), show it beside this one and ask: replace, or merge (add `ALL`, keep their ignores, add the ones above). `ruff.toml` and `.ruff.toml` take precedence over `pyproject.toml`, so edit the file the repo uses.

No ruff rule catches a test that asserts nothing. The rule block from [`../../../docs/tautological-tests.md`](../../../docs/tautological-tests.md) covers that.

## Pyright in `pyproject.toml`

```toml
[tool.pyright]
typeCheckingMode = "strict"
enableTypeIgnoreComments = false
reportUnnecessaryTypeIgnoreComment = "error"
```

- `enableTypeIgnoreComments = false` makes Pyright ignore bare `# type: ignore`, so a suppression has to be `# pyright: ignore[<rule>]`, which names its rule.
- `reportUnnecessaryTypeIgnoreComment` fails on suppressions that no longer suppress anything.
- If `pyrightconfig.json` exists, it takes precedence: show it and ask: move it into `pyproject.toml` with the keys above, or add the keys to it.
- On an existing codebase strict mode can produce many errors, mostly from untyped dependencies. Say so in the plan, and offer `typeCheckingMode = "standard"` as the alternative.

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
      - uses: astral-sh/setup-uv@v10.4.0
      - run: uv sync --locked
      - run: uv run ruff check .
      - run: uv run ruff format --check .
      - run: uv run pyright
      - run: uv run pytest
```

- `<base>` is the base branch.
- `uv sync --locked` fails when `uv.lock` is out of date with `pyproject.toml`. uv installs the Python version from `.python-version` or `requires-python`, so the job needs no setup-python step.
- pytest exits 5 when it collects no tests. If the repo has no tests yet, leave the pytest step out of CI and `### Checks`, and say so in the plan: the first ticket that adds a test adds the step.
- Before writing, check the latest release of each action with `gh api repos/<owner>/<action>/releases/latest --jq .tag_name`. Use the major for `actions/checkout` (`v7`). Use the full tag for `astral-sh/setup-uv` (`v10.4.0`): it publishes no major tags, so `@v10` fails to resolve.

## Checks

The `### Checks` line:

```
uv run ruff check . && uv run ruff format --check . && uv run pyright && uv run pytest
```

## Run

Run `uv sync --locked`, then each command in `### Checks`. If `ruff format --check .` lists files, run `uv run ruff format .` only if the user says yes: it can touch every file. Do not run `ruff check --fix` either. On an existing codebase red ruff or Pyright is expected: report it, do not fix the code in this PR.
