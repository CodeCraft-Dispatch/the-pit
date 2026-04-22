# Engineering Workflow Instructions

Use this instruction set when making engineering changes in The Pit.

## Default sequence

1. Read the relevant knowledge-base docs first.
2. Express the slice as specification by example under `specifications/`.
3. Make the smallest failing test or validator concrete.
4. Implement the smallest change that turns the slice green.
5. Refactor only while the suite is green.
6. Run mutation testing before calling the slice complete.
7. Build the knowledge or runtime surface and keep it releasable.

## Mandatory preferences

- Prefer declarative and functional designs.
- Keep domain semantics crisp and predictable.
- Use domain language in tests, docs, and content.
- Prefer helper DSLs over raw arrange-act-assert clutter in tests.
- Avoid expensive or paid tooling when open-source alternatives exist.

## Never do this

- start behavior in implementation before examples exist
- accept a red build as temporary normal
- skip mutation because the tests “look good enough”
- bury security decisions outside the repository contract and knowledge base
- introduce one-off process exceptions without updating canon or architecture docs
