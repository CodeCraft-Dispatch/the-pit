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

## Architectural stance

- Prefer a world-process engine over a physics-first engine.
- Keep stable semantics in code and mutable authored situations in content.
- Model the world in terms of views, commands, events, policies, feedback loops, and time.
- Preserve a strict distinction between world truth and player-visible truth.
- Keep event logs, replay, and contradiction timing first-class.

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

## Before changing anything substantial

Check the knowledge base first:

- `docs/knowledge-base/game-premise.md`
- `docs/knowledge-base/world-canon.md`
- `docs/knowledge-base/narrative-and-progression.md`
- `docs/knowledge-base/engine-architecture.md`
- `docs/knowledge-base/content-system.md`
- `docs/knowledge-base/persistence-and-replay.md`

## Preferred contribution pattern

1. State the design pressure clearly.
2. Identify which canon rule or engine constraint is involved.
3. Propose the smallest change that preserves the game's identity.
4. Update docs when the change affects canon, architecture, content semantics, or workflow.
5. Keep language crisp and reusable.

## Anti-patterns

- "Add more content" without updating the underlying process model.
- Hardcoding one-off narrative exceptions into engine logic.
- Replacing lawful contradiction with randomness.
- Treating maps, notes, and traces as passive collectibles.
- Writing agent guidance that duplicates the knowledge base instead of pointing to it.

## Definition of good work here

Good work makes the project more legible, more extensible, and more faithful to its hidden thesis without flattening its mystery.
