---
name: help
description: Say which spkstack skill fits a task, and the exact command to type, from the skills actually installed. Use when the user asks which skill to use, what spkstack can do, how to start, what comes next in the loop, or types /spkstack:help with or without a task.
argument-hint: "[task]"
compatibility: No requirements. Reads only the installed plugin's own files.
---

# help

Point the user at the right skill for a task. The answer comes from the skills installed next to this one, so it never goes stale when skills are added.

Task (may be empty): $ARGUMENTS

## Hard limits

- Read-only. Do not run another skill, a `gh` command, or anything that changes state.
- Recommend only skills that exist in step 1, or the Claude Code commands named in step 2.
- Keep the answer to a few lines. No em dashes. No emoji.

## 1. Read what is installed

1. List `../*/SKILL.md`, relative to this skill's base directory. From each, read the frontmatter: `name`, `description`, `argument-hint`. The command is `/spkstack:<folder name>`.
2. Read `../../README.md`, relative to this skill's base directory: the loop diagram and the skills table. If it is missing, use the frontmatter alone.

## 2. Answer

**With a task**: match it against each skill's description and the loop.

- Name one skill, the exact command to type (with an argument when the task gives one, for example an issue or PR number), and one line on why.
- If a later step in the loop usually follows, name it in one more line.
- If a built-in Claude Code command fits better, say so instead:
  - Bugs or code quality in a diff: `/code-review`.
  - Security of a change: `/security-review`.
  - Commit, push, open a PR, and watch it: `/ship` (typed by the user).
  - Watch one existing PR until it merges: `/steward` (typed by the user).
- If nothing fits, say so in one line and show the list from the no-task answer.

**Without a task**: print the loop from the README, then one line per installed skill: command and a short version of its description.

## 3. Report

The answer from step 2 is the report. Do not add anything after it.
