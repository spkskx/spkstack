# spkstack

A Claude Code plugin. Each folder under `skills/` is one skill and shows up as `/spkstack:<folder>`.

## Adding or changing a skill

- One folder per skill: `skills/<name>/SKILL.md`. The folder name is the command name.
- Frontmatter: `name`, `description` (what it does and when to use it, with the phrases a user would actually say), `argument-hint`, `compatibility`.
- Every skill has a `Hard limits` section near the top and ends with a short report to the user.
- Skills hand work to each other through files and GitHub artifacts defined in `docs/` (for example `docs/ticket-contract.md`). If two skills share a format, the format lives in `docs/` and both skills point to it by a path relative to their base directory (`../../docs/<file>.md`). Change the doc first, then the skills.
- Ask before anything outward-facing (creating issues, repos, PRs, pushes) unless the skill's flow already has an explicit approval step.
- Write concisely. No em dashes. No emoji.
- Build only what a real project needed. Add a skill to the README roadmap first, build it when it is used.

## Releasing

- Bump `version` in `.claude-plugin/plugin.json` on every change. Installed copies are cached by version.
- Validate: `claude plugin validate .`
- Try it locally before pushing: `claude --plugin-dir .`
