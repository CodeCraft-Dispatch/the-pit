---
name: wasm-kernel-architecture
description: design and review the pit's webassembly simulation kernel, kernel module boundaries, boot-time kernel feature flags, deterministic replay, snapshot behavior, wasm host boundaries, and zero-cost kernel extension strategy. use when shaping wasm process-core work, kernel capability gates, kernel module manifests, or performance-sensitive deterministic runtime slices.
---

# WebAssembly Kernel Architecture

Read these first:

- `docs/knowledge-base/wasm-kernel.md`
- `docs/knowledge-base/kernel-module-flags.md`
- `docs/knowledge-base/engine-architecture.md`
- `docs/knowledge-base/feature-flags.md`
- `docs/knowledge-base/persistence-and-replay.md`
- `codex/instructions/wasm-kernel-workflow.md`
- `AGENTS.md`

## Core stance

The WebAssembly kernel is the deterministic simulation core of the world-process engine.

It is not the whole engine, not a physics-first engine, and not a browser integration layer.

## Working method

1. identify the semantic pressure
2. decide whether it truly belongs in the kernel
3. define the module card before implementation
4. define the boot-time kernel feature flag
5. write enabled, disabled, missing-dependency, and replay examples first
6. preserve snapshot and capability provenance
7. keep the ABI narrow
8. document lawful degradation behavior

## Module card template

```markdown
## Module

Name:
Purpose:
Owned state:
Commands accepted:
Events emitted:
Queries exposed:
Snapshot schema:
Feature flag gate:
Dependencies:
Disabled behavior:
Replay cases:
Performance budget:
```

## Kernel ownership test

Move behavior into Wasm only when it is deterministic, replay-relevant, performance-sensitive, stable across content packs, and expressible through command/event contracts.

Keep narrative policy, UI logic, content authorship, storage ownership, and browser APIs outside the kernel.

## Feature flag rule

Kernel flags are boot-time capability gates.

They should be hidden, build-persistent, immutable at runtime, and testable. The platform shell resolves them before boot; the kernel consumes an immutable snapshot or bitset.

## Watch for

- raw kernel flag checks in authored content
- string flag lookups inside hot loops
- mutable kernel capabilities after simulation starts
- ad hoc module state that cannot be snapshotted
- diagnostics changing simulation semantics
- content mini-runtimes leaking into kernel code
- paid services introduced to solve local deterministic problems
