# Deterministic Tick Loop

The deterministic tick loop is the first executable slice of the kernel runtime
contract. It advances world processes by explicit fixed ticks, accepts domain
command envelopes, emits semantic events, snapshots replayable state, and
preserves capability provenance.

## Wasm decision

This slice is **Wasm-targeted, with a staged Wasm implementation path**.

There are now two intentionally separate layers:

- `runtime/kernel/deterministic-tick-loop.mjs` is the executable reference model
  for process semantics, command envelopes, semantic events, snapshots,
  diagnostics, and replay behavior.
- `runtime/kernel/wasm/tick-loop-core.mjs` is the first real Wasm-facing kernel
  slice. It boots a tiny compiler-free WebAssembly module from an immutable
  capability mask and advances a deterministic fixed tick counter when
  `kernel.wasm.processCore` is enabled.

That split is deliberate.

The project needs deterministic semantics, replay contract, capability snapshot
shape, and security validation to be executable before committing all process
logic to a compiled Wasm implementation. Keeping the semantic reference model in
`.mjs` gives the zero-cost repository pipeline fast Node.js tests with no
additional compiler, bundler, SDK, hosted service, or paid dependency. The first
Wasm core proves the host/kernel boot and fixed-step ABI without prematurely
moving higher-level process meaning into raw Wasm memory.

The `.d.ts` file fixes the TypeScript-facing host shape that a future platform
shell can consume and that a fuller Wasm module can replace behind the same
command, event, snapshot, and capability boundary.

## Why this still belongs to the kernel boundary

The loop owns stable deterministic process semantics rather than browser
integration, persistence ownership, UI logic, narrative policy, or content
authoring. It satisfies the kernel ownership test because it is replay-relevant,
independent of presentation, expressible through a small command/event contract,
and intended to become performance-sensitive as authored process counts grow.

The `.mjs` implementation acts as the executable reference model. The Wasm tick
core acts as the first ABI proof and production-kernel stepping stone.

## Runtime placement

- `.mjs`: zero-cost executable reference model and Node.js test target.
- `.d.ts`: TypeScript host boundary for the future platform shell.
- Wasm tick core: minimal boot/tick capability proof behind a narrow host API.
- Future Wasm process core: fuller production kernel target once command,
  event, snapshot, and replay semantics are stable.

## Capability model

Kernel behavior is controlled only by immutable boot-time capability snapshots.
The tick loop does not resolve remote flags, read player profile flags, mutate
kernel capabilities during active simulation, or let content branch on raw
kernel flag identifiers.

The current reference model honors these capability gates:

- `kernel.wasm.processCore` enables process advancement and command handling.
- `kernel.module.diagnostics` exposes hidden diagnostics without changing
  simulation truth.

The Wasm tick core consumes a narrow integer capability mask derived from the
same boot snapshot. It advances ticks only when the process-core bit is enabled.
When process core is disabled, it returns explicit disabled-capability feedback
without mutating tick state.

## Security posture

The reference model validates all externally supplied identifiers before commands
enter the queue. Identifiers are limited to a small safe character set and
bounded length so command IDs and process IDs cannot become accidental HTML,
path, selector, or diagnostic injection payloads in later projections.

The Wasm tick core validates tick deltas in the JavaScript host wrapper before
values cross the Wasm boundary.

Snapshots are restored only when the schema version and capability snapshot are
compatible. This prevents replay drift caused by silently changing kernel
capabilities between the original run and restored run.

## Test-first contract

The reference-model slice is covered by executable tests for:

- identical event sequences from identical fixed tick command streams;
- opening and advancing dormant processes through command envelopes;
- keeping recurring processes observable without blocking future ticks;
- lawful degradation when process core is disabled;
- snapshot restore and incompatible capability rejection;
- unsafe command identifier rejection.

The Wasm tick-core slice is covered by executable tests for:

- deriving a narrow Wasm capability mask from a boot snapshot;
- booting with immutable capabilities and advancing fixed ticks;
- lawful disabled-capability feedback without tick mutation;
- rejecting invalid tick deltas before they cross the Wasm boundary;
- matching the reference model's tick count for an enabled fixed-step run.

These tests implement the existing fixed-step process core, initial Wasm kernel,
scheduler/replay, and boot capability snapshot specifications without adding
another specification file for duplicate behavior.
