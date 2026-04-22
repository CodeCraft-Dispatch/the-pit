---
name: engine-architecture
description: design and review the pit's runtime as a process-centric engine with clear boundaries between platform shell, simulation kernel, domain runtime, content model, and tools. use when shaping engine architecture, process semantics, event logs, replay, topology, progression services, or spatial and physics adapters.
---

# Engine Architecture

Read these first:

- `docs/knowledge-base/engine-architecture.md`
- `docs/knowledge-base/content-system.md`
- `docs/knowledge-base/persistence-and-replay.md`
- `AGENTS.md`

## Core stance

The Pit is a world-process engine, not a physics-first engine.

## Working method

1. identify the semantic pressure
2. decide which layer owns it
3. preserve world truth versus player-visible truth separation
4. preserve event and replay visibility
5. keep stable semantics in code and authored situations in content

## Watch for

- logic trapped in UI handlers
- ad hoc state flags instead of explicit process semantics
- content files becoming mini runtimes
- replay and migration concerns deferred too late
- spatial tooling taking over the architecture simply because it is easier to visualize
