# WebAssembly Kernel Workflow

Use this workflow when proposing, implementing, or reviewing a WebAssembly kernel slice for The Pit.

## 1. Start from ownership

Classify the behavior before designing it.

Use the kernel only when the behavior is:

- deterministic runtime semantics
- performance-sensitive
- replay-relevant
- stable across content packs
- expressible through narrow commands and events

Keep behavior outside the kernel when it is:

- browser integration
- UI state
- player preference
- profile or save storage
- narrative progression policy
- authored content variation
- developer tooling only

## 2. Define the module

Write the module card before implementation:

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

Do not begin implementation until this card is coherent.

## 3. Define the feature flag

Every kernel module needs an explicit boot-time gate.

Use the pattern:

`kernel.<area>.<capability>`

Default to:

- `kind`: `kernel`
- `exposure`: `hidden`
- `persistence`: `build`
- `mutableAtRuntime`: `false`
- `testable`: `true`

Kernel flags must resolve before boot and become an immutable capability snapshot or bitset.

## 4. Write executable examples first

For each module, add executable examples for:

- enabled behavior
- disabled behavior
- missing dependency behavior
- deterministic replay
- snapshot and restore if the module owns state

Prefer small domain-level examples over broad end-to-end smoke tests.

## 5. Preserve replay and provenance

Every replay-relevant kernel slice must record:

- manifest version
- resolved kernel capability snapshot
- module schema version where applicable
- seed or deterministic input stream
- command sequence
- emitted event sequence

If a replay cannot run because a capability is missing, fail lawfully with a diagnostic reason.

## 6. Keep the ABI narrow

Prefer packed command envelopes, stable numeric capability IDs, and semantic events.

Avoid:

- chatty cross-boundary calls
- passing nested UI-shaped objects into Wasm
- exposing kernel memory layout to the domain runtime
- string flag lookup inside hot paths

## 7. Make performance visible

Each slice should expose development diagnostics under a hidden/operator flag when useful.

Track only what informs design:

- tick duration
- queue depth
- process count
- event count
- snapshot size
- rejected module calls
- budget overruns

Diagnostics must not change simulation semantics.

## 8. Degrade lawfully

When a module is optional, disabled behavior should map to a game-legible state:

- occluded route
- unavailable thread
- dormant surface
- stale trace
- symbolic fallback
- diagnostic unavailable

Do not leak backend failure language into player-facing text.

## 9. Review checklist

Before merging a kernel slice, verify:

- module card exists
- flag entry exists and validates
- enabled and disabled examples exist
- deterministic replay passes
- snapshot compatibility is stated
- performance risk is named
- docs are updated
- no browser APIs appear in kernel code
- no raw kernel flags appear in authored content
- no paid service is introduced
