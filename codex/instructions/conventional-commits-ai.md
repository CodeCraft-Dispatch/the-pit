# Conventional Commits for AI Contributions

Use this instruction whenever an AI agent creates a commit in The Pit.

## Required commit format

Every AI-authored commit message must follow Conventional Commits:

`<type>(<optional-scope>): <imperative summary>`

Examples:

- `docs(kernel): define immutable boot-time feature flags`
- `test(spec): add replay capability coverage`
- `fix(content): prevent contradiction status regression`

## Allowed types

- `feat`
- `fix`
- `docs`
- `test`
- `refactor`
- `chore`
- `ci`

## Rules

- Use lowercase `type` and `scope`.
- Keep the summary concise and imperative.
- Keep subject lines specific to one change slice.
- Use a body only when extra context is needed.
- Do not use placeholder commit messages.
