# Grilling

How a spkstack skill interviews the user when an idea is vague or a ticket is blocked on a decision. Derived from Matt Pocock's [grilling skill](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling). `/spkstack:idea-to-tickets` grills the idea before the MVP cut. `/spkstack:ticket-to-pr` grills an ambiguous or `needs-info` ticket in an attended run. Change this file first when the protocol changes, then update both skills.

## When

- An idea is too vague to cut an MVP from.
- Acceptance criteria can be read more than one way, or a ticket carries `needs-info` questions.
- A breakdown or plan hits a choice the user has not made and that changes what gets built.

Never in an unattended run. There, questions go on the ticket as the contract's Unattended runs section says, each with a recommended answer, so a later grill can settle them fast.

## Design tree

Model the open work as a tree of decisions. Each decision branches into the decisions that depend on its answer. The **frontier** is every open decision whose parents are settled.

Only grill decisions that change the tickets: scope, users, acceptance criteria, ordering, stack, data that must exist. Leave implementation detail that ticket-to-pr can decide on its own.

## Facts vs decisions

- **A fact the repo or tools can answer** (stack, existing files, config, what an endpoint returns): find it yourself. Read the files or send a subagent with a fresh context. Never ask the user. Only the decisions that depend on it wait; the rest of the frontier goes ahead.
- **A fact only the user has** (prices, URLs, names, credentials, sources): ask. If they do not know, it becomes a `TODO` and the skill's usual missing-facts rule applies. Never invent one.
- **A decision**: always the user's. Give a recommendation, but they decide.

## Rounds

1. Ask the whole frontier in one round, then wait.
2. Each question is short, offers concrete options, and puts the recommended answer first. Word it so that "yes" accepts the recommendation.
3. With AskUserQuestion: up to four questions per call, recommended option first and labeled `(Recommended)`. A frontier larger than four takes several calls in the same round. Without it: a numbered list, each question followed by `Recommended: <answer>`, so one "yes" accepts them all.
4. After the answers, recompute the frontier. Questions under a decision that is still open wait for a later round.
5. Before each round, say in one line what is settled so far and what you looked up instead of asking.

The user can end early ("go with your recommendations", "enough"). Then every open decision takes its recommended answer and is recorded as an assumption.

## Done

Grilling ends when the frontier is empty: every branch visited and nothing silently assumed. Then restate the result in a few lines (decisions, assumptions, `TODO`s) and wait for the user to confirm it before acting on it.

## Record

What was settled must outlive the conversation, so the next skill reads it from GitHub, not from memory:

- **Idea**: the epic's `## Decisions` section (one line each: the decision, the answer, why if it is not obvious). Assumptions are marked `(assumed)`. Open facts go in `## Open questions` as `TODO`s.
- **Ticket**: edit the ticket body so the acceptance criteria say what was decided, and comment the decisions on the ticket. If a decision changes the spec, edit the epic too and say what changed in a comment on it.
