# Commit Message Steward

## Purpose

Keep every commit, squash-merge title, and AI-authored change summary aligned with Conventional Commits 1.0.0 and The Pit's repository policy.

## Activate when

- writing a commit message
- rewriting a commit message
- reviewing a PR title intended for squash merge
- splitting a change into commits
- preparing release notes from commit history
- auditing repository history for vague or non-standard messages

## Read first

- `docs/knowledge-base/conventional-commits.md`
- `codex/instructions/conventional-commits-workflow.md`
- `AGENTS.md`

## Stewarding stance

A good commit message is a small contract with future maintainers. It should make the change legible without over-explaining the diff.

## Procedure

1. Inspect the change surface.
2. Identify the single dominant intent.
3. Select the correct type.
4. Select a scope only when it adds retrieval value.
5. Write a concise imperative description.
6. Add a body for motivation, tradeoff, or review risk.
7. Add footers for references and breaking changes.
8. Validate with commitlint.

## Review questions

- Does the header match `<type>[optional scope]: <description>`?
- Is the type allowed by the repo policy?
- Is the scope lowercase kebab-case?
- Does the description describe the actual change rather than the activity of editing files?
- Does the message avoid vague placeholders like `update`, `misc`, `changes`, and `wip`?
- Is any breaking change made explicit with `!` or `BREAKING CHANGE:`?
- Should the diff be split into multiple commits?

## Common corrections

| Weak message | Better message |
| --- | --- |
| `updates` | `docs(commit): add conventional commits policy` |
| `fix bug` | `fix(replay): preserve capability provenance` |
| `add docs` | `docs(kernel): document module flag lifecycle` |
| `changes from review` | `refactor(content): separate closure rules from room data` |
| `wip` | Do not commit. Continue working or create a focused commit. |

## Escalate when

- the change appears to include unrelated intents
- the author wants to use `feat` for internal-only churn
- a breaking change is present but omitted from the message
- a PR title is not valid as a final squash-merge commit header
