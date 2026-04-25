# Repo Standards

Use this instruction set when making any substantive change in The Pit.

## Always do first

1. Read `AGENTS.md`.
2. Read the relevant files in `docs/knowledge-base/`.
3. Identify whether the task affects canon, representation, runtime semantics, content authoring, or workflow.

## Canon guardrails

- Preserve the hidden thesis.
- Preserve stewardship over omniscience.
- Preserve the city as a wounded civic ecology.
- Preserve contradiction as lawful method failure, not randomness.

## Technical guardrails

- Prefer process semantics over ad hoc state flags.
- Prefer event emission over invisible side effects.
- Prefer declarative authored content over hardcoded narrative branches.
- Keep world truth and player-visible truth separate.
- Keep representation surfaces first-class.
- Run `npm run format:check` before every commit; fix violations with `npx prettier --write`.

## Documentation rule

If you change a core abstraction, update the corresponding knowledge-base file in the same branch.

## Review question

Before finalizing a change, ask:

Does this make The Pit more like itself, or more like a generic game or generic software project?
