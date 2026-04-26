# Deterministic Tick Loop

The deterministic tick loop is the first executable slice of the kernel runtime
contract. It advances world processes by explicit fixed ticks, accepts domain
command envelopes, emits semantic events, snapshots replayable state, and
preserves capability provenance.

## Wasm decision

This slice is **Wasm-targeted, but not itself Wasm yet**.

The current implementation lives in `runtime/kernel/deterministic-tick-loop.mjs`
with TypeScript-facing declarations in
`runtime/kernel/deterministic-tick-loop.d.ts`.

That is deliberate.

The project needs the deterministic semantics, replay contract, capability
snapshot shape, and security validation to become executable before committing
to a compiled Wasm implementation. Keeping the first slice in `.mjs` gives the
zero-cost repository pipeline fast Node.js tests with no additional compiler,
bundler, SDK, hosted service, or paid dependency. The `.d.ts` file fixes the
host-facing shape that a future TypeScript platform shell can consume and that
a future Wasm module can replace behind the same command, event, snapshot, and
capability boundary.

## Why this still belongs to the kernel boundary

The loop owns stable deterministic process semantics rather than browser
integration, persistence ownership, UI logic, narrative policy, or content
authoring. It satisfies the kernel ownership test because it is replay-relevant,
independent of presentation, expressible through a small command/event contract,
and intended to become performance-sensitive as authored process counts grow.

The implementation therefore acts as the executable reference model for the
future Wasm kernel, not as a permanent browser runtime layer.

## Runtime placement

- `.mjs`: zero-cost executable reference model and Node.js test target.
- `.d.ts`: TypeScript host boundary for the future platform shell.
- Wasm: later production kernel target once the ABI and replay semantics are
  stable.

## Capability model

Kernel behavior is controlled only by immutable boot-time capability snapshots.
The tick loop does not resolve remote flags, read player profile flags, mutate
kernel capabilities during active simulation, or let content branch on raw
kernel flag identifiers.

The current slice honors these capability gates:

- `kernel.wasm.processCore` enables process advancement and command handling.
- `kernel.module.diagnostics` exposes hidden diagnostics without changing
  simulation truth.

When process core is disabled, command envelopes are rejected through semantic
`CommandRejected` events. Process truth remains unchanged.

## Security posture

The tick loop validates all externally supplied identifiers before commands enter
the queue. Identifiers are limited to a small safe character set and bounded
length so command IDs and process IDs cannot become accidental HTML, path,
selector, or diagnostic injection payloads in later projections.

Snapshots are restored only when the schema version and capability snapshot are
compatible. This prevents replay drift caused by silently changing kernel
capabilities between the original run and restored run.

## Test-first contract

The slice is covered by executable tests for:

- identical event sequences from identical fixed tick command streams;
- opening and advancing dormant processes through command envelopes;
- keeping recurring processes observable without blocking future ticks;
- lawful degradation when process core is disabled;
- snapshot restore and incompatible capability rejection;
- unsafe command identifier rejection.

These tests implement the existing fixed-step process core, scheduler/replay, and
boot capability snapshot specifications without adding another specification file
for the same behavior.
