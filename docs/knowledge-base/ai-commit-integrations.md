# AI Commit Integrations

This document explains how AI tools should participate in The Pit's commit workflow.

## Integration goal

AI should make Conventional Commits easier to use consistently, not create a second naming style.

Every AI-authored commit, suggested commit, PR title, release-note seed, and change summary that may become a commit message must follow `docs/knowledge-base/conventional-commits.md`.

## Supported integration points

Use these repository surfaces:

- `AGENTS.md` for repo-wide contributor behavior
- `codex/instructions/conventional-commits-workflow.md` for step-by-step AI behavior
- `codex/agents/commit-message-steward.md` for a specialist review role
- `codex/skills/conventional-commit-steward/SKILL.md` for reusable commit-message drafting and repair
- `codex/prompts/conventional-commit-message.md` for copyable prompts
- `commitlint.config.cjs` for machine enforcement
- `.github/workflows/conventional-commits.yml` for CI validation

## Agent rules

AI agents must:

1. inspect the diff before choosing a commit message
2. choose a valid type and optional scope
3. avoid vague headers
4. mark breaking changes explicitly
5. keep PR titles valid for squash merge
6. split unrelated work when possible
7. validate with commitlint before claiming a commit is ready

## Prompting pattern

When asking an AI tool to create a commit message, provide the diff or a precise summary and ask it to return only the final Conventional Commit message.

Recommended prompt:

```text
Draft a Conventional Commit message for this diff.
Follow The Pit policy in docs/knowledge-base/conventional-commits.md.
Return only the final commit message.

<diff>
```

## Review pattern

When reviewing a PR, ask the AI tool to validate both the PR title and the contained commit messages.

Required review checks:

- PR title is valid as the final squash commit header
- every commit in the branch is valid
- the type matches the actual diff
- breaking changes are not hidden
- the message does not claim user-visible behavior when the change is internal only

## Failure handling

If commitlint fails, repair the message rather than bypassing the check.

If the correct type is unclear, prefer `docs`, `test`, `build`, or `chore` over misusing `feat` or `fix`.

If one branch contains multiple unrelated intents, split the commits before review unless the maintainer explicitly requests one squashed commit.
