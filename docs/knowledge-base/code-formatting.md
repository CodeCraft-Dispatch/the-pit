# Code Formatting

## Tool

This repository uses [Prettier](https://prettier.io/) for consistent formatting across all file types it supports (JavaScript, TypeScript, JSON, Markdown, YAML, CSS, HTML, and more).

## Verification command

```bash
npm run format:check
```

Prettier runs in check mode against every file that is not listed in `.prettierignore`. The CI `delivery-pipeline` job runs this step and **fails the build if any file has formatting violations**.

## Fix command

```bash
npx prettier --write .
```

Run this before committing when you have added or edited any file that Prettier covers. You can also target specific files:

```bash
npx prettier --write path/to/file.md path/to/file.cjs
```

## When to run

Run `npm run format:check` (or `npx prettier --write .`) before every commit that adds or modifies:

- Markdown files (`.md`)
- JavaScript or TypeScript files (`.js`, `.cjs`, `.mjs`, `.ts`)
- JSON or YAML files (`.json`, `.yaml`, `.yml`)
- CSS or HTML files
- Any other file type Prettier covers

## Ignored paths

Files and directories in `.prettierignore` are excluded. Currently:

- `dist/`
- `reports/`
- `node_modules/`

## Why this matters

A failed format check blocks the `delivery-pipeline` job and prevents the PR from merging. Formatting is the cheapest gate to satisfy — run it before every commit, not just before pushing.

## Agent rule

AI contributors must run `npm run format:check` before calling a change complete. If any file fails, run `npx prettier --write` on those files and include the formatting fix in the same commit as the content change using `style` as the commit type only when the commit is exclusively a formatting fix. When the formatting fix accompanies a content change, include it in the same commit under the primary type.
