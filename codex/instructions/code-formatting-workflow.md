# Code Formatting Workflow

Use this instruction whenever an AI contributor adds, edits, or generates any file in The Pit.

## Source of truth

Follow `docs/knowledge-base/code-formatting.md` for the full policy.

## Required step before every commit

After writing or editing any file, run:

```bash
npm run format:check
```

If the check reports violations, fix them immediately:

```bash
npx prettier --write .
```

Then include the formatted files in the same commit.

## Agent procedure

1. Complete your content change.
2. Run `npm run format:check`.
3. If any file fails, run `npx prettier --write <file>` for each reported file.
4. Confirm the check passes: `npm run format:check` must exit with code 0.
5. Stage and commit the formatted files together with the content change.
6. Do not create a separate formatting-only commit unless the sole purpose of the change is formatting.

## File types Prettier covers

- Markdown (`.md`)
- JavaScript / TypeScript (`.js`, `.cjs`, `.mjs`, `.ts`)
- JSON (`.json`)
- YAML (`.yaml`, `.yml`)
- CSS, HTML, and other web formats

## What to do when Prettier reformats your content

Accept the Prettier output. Do not override Prettier settings for cosmetic preferences. Prettier is the source of formatting truth for this repository.

## Commit type

When a commit is exclusively a formatting fix with no behavior or content change, use `style` as the commit type:

```text
style(format): run prettier on newly added workflow files
```

When formatting accompanies a content change, include it under the primary type — do not split it into a separate commit.
