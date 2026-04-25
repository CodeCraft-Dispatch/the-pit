# WebAssembly Kernel Initial Feature Specifications

## Purpose

This document describes the initial acceptance specifications for the WebAssembly kernel and explains which behaviors each spec file covers.

For kernel architecture, see `docs/knowledge-base/wasm-kernel.md`.
For kernel module feature flags, see `docs/knowledge-base/kernel-module-flags.md`.

## Specification files

All kernel acceptance specifications live under `specifications/kernel/`.

### `initial-wasm-kernel.feature`

Top-level contract for the initial kernel release.

Covers:

- booting with an immutable capability snapshot
- deterministic replay of the same fixed-step command stream
- rejection of malformed command envelopes at the kernel boundary
- observable advancement of long-running processes without freezing play
- lawful degradation when an optional module is disabled

### `boot-capability-snapshot.feature`

Covers the immutability and provenance of the boot-time capability snapshot.

Covers:

- assembling the boot snapshot from resolved flags before the kernel starts
- recording module availability without resolving remote flags
- rejecting post-boot profile overrides
- disabling a dependent module when its required module is missing

### `fixed-step-process-core.feature`

Covers fixed-step determinism and process state transitions.

Covers:

- deterministic output for identical seeds and command streams
- process state advancement across recognized state transitions
- rejection of unknown or malformed commands
- emission of semantic events at tick boundaries

### `scheduler-and-replay.feature`

Covers scheduler fairness, budget enforcement, and snapshot/restore compatibility.

Covers:

- fair scheduling of processes within a fixed tick budget
- deferred work when the tick budget is exhausted
- snapshot production and deterministic restore
- replay consistency after snapshot restore

### `topology-and-constraints.feature`

Covers graph topology, reachability queries, occupancy, and reversible constraints.

Covers:

- registering and querying nodes and edges
- reachability between nodes
- occupancy constraint enforcement
- reversible constraint application and removal

### `diagnostics-and-spatial-fallback.feature`

Covers hidden diagnostic counters and graceful spatial capability degradation.

Covers:

- tick-duration and process-count counters hidden from players
- counter availability only when the diagnostics module is enabled
- spatial queries falling back to symbolic representation when the spatial port is disabled

## Coverage matrix

| Capability area          | Feature file                               |
| ------------------------ | ------------------------------------------ |
| Kernel contract          | `initial-wasm-kernel.feature`              |
| Boot snapshot            | `boot-capability-snapshot.feature`         |
| Fixed-step process core  | `fixed-step-process-core.feature`          |
| Scheduler and replay     | `scheduler-and-replay.feature`             |
| Topology and constraints | `topology-and-constraints.feature`         |
| Diagnostics and spatial  | `diagnostics-and-spatial-fallback.feature` |

## Authoring rules

- Write or update the executable acceptance specification before implementation.
- Each scenario should prove externally meaningful behavior, not private implementation details.
- Disabled module behavior must appear in at least one scenario per feature file.
- Replay and snapshot behavior must be covered before topology or spatial scenarios are expanded.

See `codex/instructions/wasm-kernel-feature-spec-workflow.md` for the required authoring sequence.
