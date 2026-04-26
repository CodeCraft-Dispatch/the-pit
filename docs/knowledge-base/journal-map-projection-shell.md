# Journal and Map Projection Shell

The journal and map projection shell is the first domain/runtime projection over
the semantic event log. It turns replay-safe semantic events into deterministic
journal entries and a small semantic map without moving player-facing projection
logic into the kernel.

## Module card

Name: Journal and map projection shell

Purpose: Consume cloned semantic events and derive deterministic projection state
for journal and semantic map surfaces.

Owned state:

- journal entries
- process and command map nodes
- command-target map edges
- last projected event sequence
- projection snapshot schema version
- enabled or inert projection state

Inputs accepted:

- cloned semantic event records from the semantic event log or deterministic tick
  loop outputs
- compatible projection snapshots
- immutable resolved feature capabilities

Outputs exposed:

- journal entries
- semantic map nodes and edges
- diagnostics
- projection snapshot

Snapshot schema:

- `schemaVersion`
- `enabled`
- `journalEntries`
- `semanticMap`
- `lastSequence`

Feature flag gate: `engine.projection.journalMap`

Dependency:

- `kernel.module.semanticEventLog`

Disabled behavior: Explicitly disabling either projection or semantic event
logging exposes an inert empty journal and semantic map. The projection shell does
not pretend replay or player-facing representation is available when the source
semantic facts are unavailable.

## Runtime placement

- `runtime/projections/journal-map-projection-shell.mjs` is the executable
  reference model for deterministic journal and semantic map projection.
- `runtime/projections/journal-map-projection-shell.d.ts` fixes the
  TypeScript-facing host and UI boundary.

This slice is **not Wasm-targeted yet**.

The kernel already owns fixed-step execution, process mutation, command routing,
and semantic event storage. Projection is a domain/runtime concern: it interprets
stable event facts into representation surfaces. That keeps the Wasm boundary
small and matches the rule that the kernel must not own player-facing journal,
map, UI, or narrative policy.

A future Wasm projection core should only be considered if projection grows into
a hot-path, deterministic, cross-content workload that benefits from a lower
runtime boundary. Until then, `.mjs` keeps the implementation zero-cost,
inspectable, testable with Node, and free from compiler or hosted-service
requirements.

## Boundary rule

The projection shell owns deterministic representation state. It does not own:

- command normalization
- command routing
- process mutation
- semantic event storage
- narrative progression policy
- contradiction timing
- browser persistence
- UI rendering
- content authoring

The semantic event log remains the fact store. The projection shell consumes only
cloned event records and produces cloned projection records.

## Security posture

Journal and map surfaces are player-facing or tool-facing representations, so the
projection boundary validates identifiers again before emitting projection state.
Process IDs, command IDs, event types, map node IDs, and map edge IDs must use the
same safe identifier policy as kernel command and process identifiers.

Journal summaries are bounded plain text and reject markup characters. Projection
details must remain JSON-safe primitives, arrays, or plain objects. Query and
snapshot calls clone projection state so callers cannot mutate internals.

## Test-first contract

The projection shell is covered by executable tests for:

- projecting semantic events into deterministic journal entries;
- deriving process nodes, command nodes, and command-target edges;
- snapshot and restore behavior without duplicate projections;
- rejecting unsafe projection identifiers before player-facing surfaces;
- inert disabled behavior when projection or semantic event logging is disabled.

## Extension rule

Add richer representation semantics here or in focused projection modules, not in
the semantic event log. Keep semantic event storage a deep kernel module and keep
UI rendering outside this shell.
