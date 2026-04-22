# Test-First Slice Skill

Use this reusable skill whenever a change introduces or alters behavior.

## Recipe

1. State the behavior change in domain language.
2. Capture it as a small executable example under `specifications/`.
3. Make the example fail for the right reason.
4. Add or adapt the smallest supporting automated test.
5. Implement the smallest change that makes the slice green.
6. Refactor only on green.
7. Run mutation testing against the nearest executable domain layer.
8. Build the repository surface and keep it releasable.

## Heuristics

- Prefer one thin vertical slice over broad parallel edits.
- Prefer a small DSL in the test layer over repeated setup noise.
- Prefer domain vocabulary over framework vocabulary.
- Prefer deleting duplication over explaining duplication.
