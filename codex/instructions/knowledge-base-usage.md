# Knowledge Base Usage

The knowledge base exists to prevent drift.

## When to update docs

Update the knowledge base when a change modifies:

- fixed story truth
- progression logic
- puzzle family grammar
- representation strategy
- runtime architecture
- content-system semantics
- persistence assumptions
- authoring workflow

## When not to update docs

Do not churn the knowledge base for:

- pure formatting changes
- implementation details that do not affect abstractions
- temporary experiments that are not yet accepted

## How to write new knowledge-base files

- Keep them concise.
- Prefer sharp rules over vague summaries.
- Use headings that future contributors can scan quickly.
- Name the design pressure explicitly.
- State anti-patterns when they are known.
- Link to neighboring files instead of duplicating them.

## Style

Write like a technical design memo, not marketing copy.

The knowledge base should be easy to reuse in implementation work and easy to diff over time.
