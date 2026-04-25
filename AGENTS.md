# AGENTS.md

This file is the repo-wide operating contract for Codex and other AI contributors working in The Pit.

## Mission

Preserve the identity of The Pit as a text-first, process-centric narrative puzzle game where the player becomes better locally without ever gaining a universal master key.

## Non-negotiable truths

- Do not explain the hidden computability substrate directly inside the game fiction.
- Do not collapse the project into a standard fantasy puzzle crawler.
- Do not center the engine around spectacle physics.
- Do not treat UI as garnish; journal, map, chat, and replay are part of play.
- Do not confuse activity with meaningful progress.
- Do not write lore that implies the world can be fully solved once and for all.
- Do not accept a behavior change that bypasses executable examples, automated tests, mutation, or build visibility.
- Do not create, suggest, squash, merge, or approve a commit message that violates Conventional Commits 1.0.0.

## Architectural stance

- Prefer a world-process engine over a physics-first engine.
- Keep stable semantics in code and mutable authored situations in content.
- Model the world in terms of views, commands, events, policies, feedback loops, and time.
- Preserve a strict distinction between world truth and player-visible truth.
- Keep event logs, replay, and contradiction timing first-class.
- Treat the WebAssembly kernel as a deterministic simulation core, not as the whole engine or a browser integration layer.
- Pass immutable boot-time capability snapshots into the kernel; never let the kernel resolve remote flags or own persistence.
- Prefer declarative, functional, reactive, and CUPID-aligned design.

## Delivery stance

- No behavior without executable specification first.
- Default to red-green-refactor in thin slices.
- Refactor only when the relevant tests are green.
- Follow green automated tests with mutation testing at the nearest executable domain layer.
- Represent the whole lead time in the GitHub delivery pipeline.
- Never normalize a red build.
- Reject paid tooling unless the doctrine is deliberately revised.
- Use Conventional Commits for every commit, PR title intended for squash merge, release note seed, and agent-authored change summary.
- Validate commit messages locally with `npm run lint:commit-msg -- --edit <commit-msg-file>` or across ranges with `npm run lint:commits` before treating delivery work as complete.

## Presentation stance

Prefer a hybrid 2D representation:

- left: chat, journal, dialogue, oracle output
- center: chamber board, path graph, garden surface, map, mirror layer
- right: active threads, commitments, debts, contradictions, statuses
- bottom: costly verbs and commitment actions

## Content stance

Author content in domain language, not engine jargon.

Use terms like:

- room
- chamber
- path
- garden
- relic
- oracle
- witness
- debt
- commitment
- contradiction
- bloom
- settle
- reconcile
- mutate

Avoid authoring content in terms of low-level update loops, timers, or backend-specific APIs.

## Commit message stance

All contributors and AI agents must follow `docs/knowledge-base/conventional-commits.md`.

Use this form:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Use `feat` only for user-visible or capability-visible additions. Use `fix` only for bug fixes. Mark breaking changes with `!` in the header or a `BREAKING CHANGE:` footer. Prefer focused commits that each explain one intent.

Examples:

```text
feat(kernel): add boot-time capability snapshot
fix(content): prevent oracle debt from bypassing commitment cost
docs(canon): clarify unfinished engine cost model
build(commit): add conventional commit validation
```

## Before changing anything substantial

Check the knowledge base first:

- `docs/knowledge-base/game-premise.md`
- `docs/knowledge-base/world-canon.md`
- `docs/knowledge-base/narrative-and-progression.md`
- `docs/knowledge-base/engine-architecture.md`
- `docs/knowledge-base/wasm-kernel.md`
- `docs/knowledge-base/kernel-module-flags.md`
- `docs/knowledge-base/content-system.md`
- `docs/knowledge-base/persistence-and-replay.md`
- `docs/knowledge-base/engineering-foundations.md`
- `docs/knowledge-base/delivery-pipeline.md`
- `docs/knowledge-base/security-standards.md`
- `docs/knowledge-base/conventional-commits.md`

## Preferred contribution pattern

1. State the design pressure clearly.
2. Identify which canon rule, engineering rule, or engine constraint is involved.
3. Write the smallest executable example that proves the slice.
4. Propose and implement the smallest change that preserves the game's identity.
5. Refactor only while green.
6. Run mutation before calling the slice done.
7. Update docs when the change affects canon, architecture, content semantics, workflow, security posture, or commit governance.
8. Write the commit message using Conventional Commits before finalizing the change.
9. Keep language crisp and reusable.

## Anti-patterns

- "Add more content" without updating the underlying process model.
- Hardcoding one-off narrative exceptions into engine logic.
- Replacing lawful contradiction with randomness.
- Treating maps, notes, and traces as passive collectibles.
- Writing agent guidance that duplicates the knowledge base instead of pointing to it.
- Adding broad tests without mutation-backed domain assertions.
- Letting the pipeline be advisory instead of authoritative.
- Letting content files branch on raw kernel feature flag IDs.
- Making kernel capability flags mutable during active simulation.
- Using vague commit messages such as `updates`, `misc`, `changes`, `wip`, `fix stuff`, or `checkpoint`.
- Mixing unrelated behavior, documentation, and infrastructure changes under one commit header.

## Definition of good work here

Good work makes the project more legible, more extensible, more testable, and more faithful to its hidden thesis without flattening its mystery.
