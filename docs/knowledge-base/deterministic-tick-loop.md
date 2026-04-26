# Deterministic Tick Loop

The deterministic tick loop is the first executable slice of the kernel runtime
contract. It advances world processes by explicit fixed ticks, accepts domain
command envelopes, emits semantic events, snapshots replayable state, and
preserves capability provenance.

## Wasm decision

This slice is **Wasm-targeted, with a staged Wasm implementation path**.

There are now intentionally separate layers:

- `runtime/kernel/deterministic-tick-loop.mjs` is the executable reference model
  for command scheduling, semantic event sequencing, snapshots, diagnostics, and
  replay behavior.
- `runtime/kernel/process-state-container.mjs` owns modular process-state records,
  process command application, and process advancement semantics.
- `runtime/kernel/wasm/tick-loop-core.mjs` is the first real Wasm-facing tick-loop
  slice. It boots a tiny compiler-free WebAssembly module from an immutable
  capability mask and advances a deterministic fixed tick counter when
  `kernel.wasm.processCore` is enabled.
- `runtime/kernel/wasm/process-state-container-core.mjs` is the staged
  Wasm-facing process-state container slice. It proves the gated process-state
  container boundary without prematurely moving semantic mutation into raw Wasm
  memory.

That split is deliberate.

The project needs deterministic semantics, replay contract, capability snapshot
shape, and security validation to be executable before committing all process
logic to a compiled Wasm implementation. Keeping the semantic reference model in
`.mjs` gives the zero-cost repository pipeline fast Node.js tests with no
additional compiler, bundler, SDK, hosted service, or paid dependency. The first
Wasm cores prove the host/kernel boot and fixed-step ABI without prematurely
moving higher-level process meaning into raw Wasm memory.

The `.d.ts` files fix the TypeScript-facing host shape that a future platform
shell can consume and that fuller Wasm modules can replace behind the same
command, event, snapshot, and capability boundary.

## Why this still belongs to the kernel boundary

The loop owns stable deterministic time semantics rather than browser
integration, persistence ownership, UI logic, narrative policy, or content
authoring. Process mutation is delegated to the process state container, which
satisfies the same kernel ownership test because it is replay-relevant,
independent of presentation, expressible through a small command/event contract,
and intended to become performance-sensitive as authored process counts grow.

The `.mjs` implementation acts as the executable reference model. The Wasm tick
core and Wasm process-state core act as the first ABI proofs and
production-kernel stepping stones.

## Runtime placement

- `.mjs`: zero-cost executable reference model and Node.js test target.
- `.d.ts`: TypeScript host boundary for the future platform shell.
- Wasm tick core: minimal boot/tick capability proof behind a narrow host API.
- Wasm process-state core: minimal boot/process-metadata capability proof behind
  the same process-core feature flag.
- Future Wasm process core: fuller production kernel target once command,
  event, snapshot, and replay semantics are stable.

## Capability model

Kernel behavior is controlled only by immutable boot-time capability snapshots.
The tick loop does not resolve remote flags, read player profile flags, mutate
kernel capabilities during active simulation, or let content branch on raw
kernel flag identifiers.

The current reference model honors these capability gates:

- `kernel.wasm.processCore` enables process command handling and process
  advancement through the process state container.
- `kernel.module.diagnostics` exposes hidden diagnostics without changing
  simulation truth.

The Wasm tick core and Wasm process-state core consume narrow integer capability
masks derived from the same boot snapshot. They expose behavior only when the
process-core bit is enabled.

## Security posture

The reference model validates all externally supplied identifiers before commands
enter the queue or process records enter the container. Identifiers are limited
to a small safe character set and bounded length so command IDs and process IDs
cannot become accidental HTML, path, selector, or diagnostic injection payloads
in later projections.

The Wasm tick core validates tick deltas and the Wasm process-state core
validates process counts in JavaScript host wrappers before values cross the
Wasm boundary.

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

The process-state container slice is covered by executable tests for:

- deterministic normalization and process snapshot ordering;
- opening dormant and occluded processes;
- ignored opens without mutation for already active processes;
- state setting and unknown-process rejection;
- fixed-step process advancement and settling;
- duplicate and unsafe process definition rejection.

The Wasm tick-core and Wasm process-state-core slices are covered by executable
tests for:

- deriving narrow Wasm capability masks from boot snapshots;
- booting with immutable capabilities;
- lawful disabled-capability behavior without mutation;
- rejecting invalid boundary values before they cross into Wasm;
- matching the reference model's enabled fixed-step tick count where applicable.

These tests implement the existing fixed-step process core, initial Wasm kernel,
scheduler/replay, process-state container, and boot capability snapshot
specifications without duplicating behavior across multiple specification files.
