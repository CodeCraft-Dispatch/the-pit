---
name: conventional-commit-steward
description: write, review, repair, and validate conventional commit messages for the pit. use when creating commits, preparing squash-merge pull request titles, auditing commit history, splitting changes into focused commits, or generating ai-authored change summaries that may become commit messages.
---

# Conventional Commit Steward

Read these first:

- `docs/knowledge-base/conventional-commits.md`
- `codex/instructions/conventional-commits-workflow.md`
- `AGENTS.md`

## Core rule

Every commit message must follow Conventional Commits 1.0.0.

Use this structure:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Working method

1. inspect the actual change, not only the user's wording
2. identify the dominant intent
3. choose an allowed type from the repo policy
4. choose an optional lowercase kebab-case scope
5. write the description as a concise imperative phrase
6. add a body only for motivation, tradeoff, review risk, or migration context
7. add issue references or `BREAKING CHANGE:` footers when needed
8. validate with commitlint before presenting the message as final

## Type choices

- `feat`: new capability
- `fix`: corrected broken behavior
- `docs`: documentation, canon, instructions, agents, skills, prompts
- `test`: executable examples, tests, specifications, mutation support
- `refactor`: behavior-preserving restructuring
- `perf`: performance improvement
- `build`: dependencies, package scripts, local hooks, build tooling
- `ci`: GitHub Actions or delivery automation
- `style`: formatting-only change
- `chore`: repository maintenance
- `revert`: revert a previous commit

## Output pattern

When asked for a commit message, return the final message first in a fenced text block, then include a one-sentence rationale only if useful.

When reviewing a message, say whether it passes. If it fails, return the corrected message.

## Avoid

- vague messages such as `updates`, `misc`, `changes`, `wip`, `fix stuff`
- using `feat` for invisible internal churn
- using `fix` for cleanup that does not correct broken behavior
- burying breaking changes in prose
- PR titles that cannot become valid squash-merge commit headers
- scopes with uppercase letters, spaces, underscores, or file extensions

## Examples

```text
docs(commit): add conventional commits policy
```

```text
ci(commit): validate pull request titles
```

```text
feat(kernel): add boot-time capability snapshot
```

```text
fix(content): prevent oracle debt from bypassing commitment cost
```
