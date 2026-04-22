# The Pit

The Pit is a text-first narrative puzzle game built on a concealed computability foundation.

The player should never be told the game is "about" the Halting Problem. Instead, the game should let the player inhabit its structure: some processes resolve, some consume effort without closure, and no universal surface-level rule cleanly separates the two in advance.

The design thesis is simple:

> The player can become better locally, but can never become complete globally.

This repository acts as the seed knowledge base, delivery contract, and zero-cost engineering foundation for the game, the world, the engine, and Codex-facing working conventions.

## What belongs in this repo

- Canon and worldbuilding that preserve the project's hidden thesis.
- Engine and architecture notes for a process-centric, local-first, event-driven runtime.
- Content-system guidance for declarative puzzle and narrative authoring.
- Delivery, testing, mutation, and security doctrine that keeps implementation honest.
- Codex instructions, agents, and reusable skills that keep future work aligned.

## Repository map

- `AGENTS.md` — repo-wide guidance for coding agents and future contributors.
- `docs/knowledge-base/` — authoritative markdown knowledge base.
- `specifications/` — cucumber-like executable specifications for behavior slices.
- `codex/instructions/` — repo-specific operating instructions for AI contributors.
- `codex/agents/` — specialist agent briefs for design, architecture, and quality work.
- `codex/skills/` — reusable skill bundles for disciplined slice delivery.
- `.github/workflows/delivery-pipeline.yml` — staged pipeline covering specification through build health reaction.
- `netlify.toml` — zero-cost Netlify configuration for preview and production knowledge surfaces.

## Core design pillars

1. The game is text-first, but not text-only.
2. The best presentation is a hybrid chat-plus-diagram 2D form.
3. The runtime should be a world-process engine, not a physics-led game engine.
4. Code owns stable semantics; content owns authored situations.
5. Notes, maps, inscriptions, oracle rulings, and replay traces are playable objects.
6. The ending should resolve into stewardship and disciplined judgment, not omniscience.

## Engineering foundations

1. No behavior without executable examples first.
2. Default to red-green-refactor in small slices.
3. Follow automated tests with mutation testing at the nearest executable domain layer.
4. Represent the whole lead time in the delivery pipeline.
5. Keep the build green and react automatically when mainline goes red.
6. Prefer declarative, functional, reactive, and CUPID-aligned design.
7. Reject tooling that introduces monetary cost unless the doctrine is revised deliberately.

## Immediate implementation priorities

1. Establish the minimal zero-cost delivery toolchain and repo contract.
2. Establish a minimal world-process kernel and event log.
3. Define a first-pass content DSL for rooms, gardens, paths, and oracle bargains.
4. Build a semantic map, journal, and contradiction-aware progression service.
5. Author the first playable district: archive, garden, transit, oracle, mirror, engine.
6. Preserve every future implementation decision against the canon and engineering docs in `docs/knowledge-base/`.

## Working rule

If a proposed feature makes the game feel like a conventional puzzle dungeon, a rigid scripted mystery, a physics-forward action title, or a build-optional experiment, it is probably pulling the project away from its strongest form.
