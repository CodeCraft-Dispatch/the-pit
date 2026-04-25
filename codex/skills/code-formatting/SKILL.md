---
name: code-formatting
description: check and fix prettier formatting for any file in the pit. use when adding new files, editing existing files, or resolving a delivery-pipeline format:check failure.
---

# Code Formatting

Read these first:

- `docs/knowledge-base/code-formatting.md`
- `codex/instructions/code-formatting-workflow.md`

## Core rule

Every file committed to this repository must pass `npm run format:check`. The CI `delivery-pipeline` blocks merging when this gate fails.

## Working method

1. After writing or editing any file, run `npm run format:check`.
2. Identify any files reported as violations.
3. Run `npx prettier --write <file>` for each violation, or `npx prettier --write .` for all.
4. Confirm `npm run format:check` exits with code 0.
5. Stage the formatted files with your content change before committing.

## Commands

| Purpose            | Command                             |
| ------------------ | ----------------------------------- |
| Check all files    | `npm run format:check`              |
| Fix all files      | `npx prettier --write .`            |
| Fix specific files | `npx prettier --write path/to/file` |

## Commit guidance

- Formatting fix alongside a content change → include in the same commit under the primary type.
- Formatting-only fix → use `style(format): …` as the commit message.

## Avoid

- Committing before running the format check.
- Suppressing Prettier with inline disable comments to preserve personal style.
- Creating a separate formatting commit when the format fix can travel with the content change.
