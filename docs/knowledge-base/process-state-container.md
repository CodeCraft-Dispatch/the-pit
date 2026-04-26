# Process State Container

The process state container is the modular owner of process-state records and
process-state transitions inside the deterministic kernel. It exists so the tick
loop can own time, command scheduling, event sequencing, replay, and capability
checks without also owning every process mutation rule.

## Runtime placement

- `runtime/kernel/process-state-container.mjs` is the executable reference model
  for process records, process command application, process advancement, stable
  snapshot ordering, and validation.
- `runtime/kernel/process-state-container.d.ts` fixes the TypeScript-facing host
  and future Wasm replacement shape.
- `runtime/kernel/wasm/process-state-container-core.mjs` is the first staged
  Wasm-facing proof for the container boundary. It boots from an immutable
  capability mask and exposes only gated process metadata.

This mirrors the deterministic tick-loop strategy: keep full semantics in a
zero-cost `.mjs` reference model while using a tiny compiler-free Wasm slice to
prove the host/kernel capability boundary before moving richer process semantics
into compiled Wasm memory.

## Capability gate

Process-state behavior is gated by `kernel.wasm.processCore`.

When the flag is enabled:

- process definitions are normalized into validated records;
- command envelopes can open dormant or occluded processes;
- command envelopes can set valid process states;
- opened or advancing processes progress on fixed ticks;
- recurring processes remain observable without blocking the simulation.

When the flag is disabled:

- the deterministic tick loop rejects process commands lawfully;
- the tick loop does not advance process state;
- the Wasm process-state core boots inert and snapshots a process count of `0`.

The container does not resolve flags at runtime. The platform shell must resolve
capabilities before boot and pass an immutable snapshot to the kernel.

## Security posture

The container validates externally supplied process identifiers before records
enter simulation state. Identifiers are bounded to 1-128 safe characters using
the same safe identifier policy as command envelopes. This prevents process IDs
from becoming accidental HTML, path, selector, or diagnostic injection payloads
when later projected into journals, maps, tools, or replay inspectors.

Duplicate process identifiers are rejected during container creation. Invalid
process states and unsafe progress counters are rejected before simulation.

## Test-first contract

The process-state container is covered by executable tests for:

- deterministic process normalization and snapshot ordering;
- opening dormant and occluded processes;
- ignoring open commands for already active processes without mutation;
- setting valid process states and rejecting unknown process targets;
- advancing opened processes and emitting settling events;
- rejecting duplicate and unsafe process definitions;
- deriving the staged Wasm process-state capability mask;
- booting the Wasm process-state core with enabled capabilities;
- keeping the Wasm process-state core inert when process core is disabled;
- rejecting invalid process counts before values cross the Wasm boundary.

## Extension rule

Add new process-state behavior to the reference container first, with executable
coverage and a feature specification. Add a staged Wasm shape only when the
boundary must be proven or the behavior is ready to move closer to the production
kernel. Keep browser APIs, persistence, content authoring, and UI projection out
of this module.
