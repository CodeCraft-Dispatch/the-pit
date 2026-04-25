# Conventional Commits Workflow

Use this instruction whenever an AI contributor creates, rewrites, reviews, squashes, or proposes commit messages for The Pit.

## Source of truth

Follow `docs/knowledge-base/conventional-commits.md` and the Conventional Commits 1.0.0 specification.

## Required output

Every commit message must use this shape:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Agent procedure

1. Inspect the actual change before choosing a type.
2. Identify the single dominant intent.
3. Choose the type from the repository policy.
4. Choose a lowercase kebab-case scope when it improves history scanning.
5. Write the description as an imperative phrase.
6. Add a body only when the why, tradeoff, or review risk matters.
7. Add `BREAKING CHANGE:` when compatibility, content schemas, replay snapshots, exported DSL, public commands, or documented behavior must migrate.
8. Validate with commitlint before considering the commit ready.

## Type decision guide

- Use `feat` for new capabilities.
- Use `fix` for corrected broken behavior.
- Use `docs` for knowledge base, prompt, agent, skill, canon, or instruction changes.
- Use `test` for executable examples, specifications, fixtures, test harnesses, or mutation support.
- Use `refactor` for behavior-preserving restructuring.
- Use `perf` for performance improvements.
- Use `build` for package scripts, dependencies, local hooks, build tooling, or generated build surfaces.
- Use `ci` for GitHub Actions and pipeline automation.
- Use `style` for formatting-only changes.
- Use `chore` for repository maintenance.

## Split rule

Prefer multiple commits when a change contains multiple unrelated intents. If the user asks for one squashed commit, make the PR title the valid Conventional Commit header and explain the major included areas in the PR body.

## Review checklist

Before proposing or accepting a commit message, confirm:

- the header has a valid type
- the scope is optional but useful when present
- the description is not vague
- the subject does not end with a period
- breaking changes are explicit
- the message matches the actual diff
- the message is not using `feat` for internal-only churn
- the message is not using `fix` for pure cleanup

## Examples

```text
feat(kernel): add module capability manifest

Adds a manifest contract so deterministic kernel modules can declare flags,
dependencies, snapshot state, and disabled behavior before implementation.
```

```text
fix(replay): preserve capability provenance in snapshots

Replay snapshots must keep the boot-time feature flag snapshot so historical
runs cannot be reinterpreted under the current browser capabilities.
```

```text
docs(skill): add conventional commit steward
```

```text
ci(commit): validate pull request titles
```
