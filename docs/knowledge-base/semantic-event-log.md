# Semantic Event Log

The semantic event log is the modular owner of deterministic event storage,
event sequence allocation, event querying, and replayable event-log snapshots
inside the kernel reference model.

It exists so the deterministic tick loop can own fixed time advancement while a
focused module owns the details of how semantic event drafts become stable,
queryable, replay-safe records.

## Module card

Name: Semantic event log

Purpose: Store replay-relevant semantic events with deterministic sequence
numbers, tick stamps, validated event types, validated detail keys, and a
versioned snapshot shape.

Owned state:

- semantic event records
- next event sequence
- semantic event log schema version
- enabled or inert module state

Commands accepted: none directly. The log accepts semantic event drafts emitted
by kernel modules after command routing and process mutation have already
happened.

Events emitted: none. The module stores events; it does not create process
meaning or dispatch follow-up actions.

Queries exposed:

- all events
- events by type
- event count
- next sequence
- diagnostics
- snapshot

Snapshot schema:

- `schemaVersion`
- `enabled`
- `events`
- `nextSequence`

Feature flag gate: `kernel.module.semanticEventLog`

Dependencies:

- `kernel.wasm.processCore`

Disabled behavior: Explicit `false` disables persistent semantic event storage.
The tick loop may still advance process state, but emitted event lists, stored
logs, replay traces, and event-log snapshots degrade to an inert stale trace with
no events.

Replay cases:

- same seed, same capabilities, same command stream produces identical event
  sequences
- restored snapshots preserve event order, next sequence, and schema version
- incompatible capability snapshots still fail at the tick-loop restore boundary
- disabled semantic logging remains inert and does not pretend replay data exists

Performance budget: O(1) append for active ticks, O(n) query/snapshot clone, no
browser APIs, no storage APIs, no remote services, and no hot-path feature-flag
resolution beyond immutable boot capability state.

## Runtime placement

- `runtime/kernel/semantic-event-log.mjs` is the executable reference model for
  semantic event validation, append, query, diagnostics, and snapshots.
- `runtime/kernel/semantic-event-log.d.ts` fixes the TypeScript-facing host
  shape.
- `runtime/kernel/wasm/semantic-event-log-core.mjs` is the staged Wasm-facing
  proof for the event-log metadata boundary. It boots from an immutable
  capability mask and exposes only gated event-count metadata.

This follows the same staged pattern as the deterministic tick loop, command
dispatcher, and process state container: keep complete behavior in a zero-cost
`.mjs` reference model, then add a tiny compiler-free Wasm slice to prove the
host/kernel ABI before moving richer semantics into compiled Wasm memory.

## Boundary rule

The semantic event log owns event persistence inside the kernel reference model.
It does not own:

- command normalization
- command routing
- process mutation
- narrative interpretation
- journal projection
- semantic map projection
- browser storage
- UI rendering
- content authoring policy

The tick loop remains responsible for fixed ticks. The command dispatcher remains
responsible for command queues and routing. The process state container remains
responsible for process records and transitions. The semantic event log receives
only event drafts and turns them into stable kernel event records.

## Capability gate

The module has an explicit kernel flag:

- `kernel.module.semanticEventLog`

It depends on:

- `kernel.wasm.processCore`

For compatibility with the earliest process-core reference model, a missing
`kernel.module.semanticEventLog` value keeps logging enabled in `.mjs` runtime
code. Once a boot snapshot declares the flag explicitly, `false` is treated as a
hard disablement.

When enabled:

- semantic event drafts are validated before storage;
- event sequence numbers are allocated monotonically;
- events receive the current deterministic tick stamp;
- event queries return cloned records;
- snapshots preserve event order, next sequence, and schema version.

When explicitly disabled:

- event drafts are still validated at the boundary;
- no events are stored;
- tick-loop `advance()` returns no events;
- `getEvents()` and `findEventsByType()` return empty arrays;
- the snapshot records an inert disabled event-log state.

## Security posture

Event type identifiers and top-level event detail keys use the same safe
identifier policy as command and process identifiers. This keeps event records
from becoming accidental HTML, path, selector, or diagnostic injection payloads
when later projected into journals, maps, replay inspectors, authoring tools, or
operator diagnostics.

The module clones all event records on query and snapshot boundaries. Callers do
not receive mutable access to the internal event list.

The Wasm event-log wrapper validates event counts before values cross the Wasm
boundary and gates event-count metadata behind immutable boot capabilities.

## Test-first contract

The semantic event log is covered by executable tests for:

- deterministic append sequence, tick, and detail ordering;
- restored event ordering and duplicate sequence rejection;
- unsafe event type and event detail key rejection;
- explicit disabled-module inert behavior;
- event querying without mutable internal-state exposure;
- tick-loop event recording and event-type queries;
- snapshot and restore without event-log drift;
- tick-loop degradation to a stale trace when semantic logging is disabled;
- deriving the staged Wasm capability mask;
- booting the staged Wasm semantic event log core with enabled capabilities;
- keeping the staged Wasm core inert when semantic logging or process core is
  disabled;
- rejecting invalid event counts before values cross the Wasm boundary.

## Extension rule

Add new event semantics where the event is produced, not in the event log. The
log should remain a deep module with a small interface: validate, append, query,
snapshot, and expose diagnostics. Do not add narrative policy, projection logic,
content branching, storage ownership, or browser APIs to this module.
