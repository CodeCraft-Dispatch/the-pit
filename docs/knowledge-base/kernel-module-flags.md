# Kernel Module Feature Flags

## Purpose

Kernel module flags allow The Pit to grow the WebAssembly kernel over time without forcing every low-level capability into every build, save, test, or content pack.

They are not product rollout switches. They are boot-time capability declarations.

## Principle

A kernel flag answers one question:

Can this deterministic kernel capability participate in this booted runtime?

It does not answer:

- Should the player see this setting?
- Should this story arc appear?
- Should this content pack be installed?
- Should the remote service roll this out to 5% of users?

The platform shell resolves the flag. The kernel consumes the result.

## Naming convention

Use dot-separated names that make ownership obvious.

Recommended pattern:

`kernel.<area>.<capability>`

Examples:

- `kernel.wasm.processCore`
- `kernel.module.scheduler`
- `kernel.module.topology`
- `kernel.module.constraints`
- `kernel.module.snapshotReplay`
- `kernel.module.diagnostics`
- `kernel.spatialPort.basicQueries`

Avoid vague names such as:

- `kernel.experimental`
- `kernel.fastMode`
- `kernel.newStuff`
- `kernel.v2`

## Manifest fields

Every kernel flag should declare:

```json
{
  "id": "kernel.module.topology",
  "kind": "kernel",
  "description": "Enable deterministic topology primitives for graph, route, region, and rewrite queries.",
  "default": false,
  "exposure": "hidden",
  "persistence": "build",
  "mutableAtRuntime": false,
  "testable": true,
  "requires": ["kernel.wasm.processCore"],
  "tags": ["wasm", "kernel", "module"]
}
```

## Field rules

Kernel flags should normally be:

- `kind`: `kernel`
- `exposure`: `hidden`
- `persistence`: `build`
- `mutableAtRuntime`: `false`
- `testable`: `true`

Kernel flags must not be player-exposed. A player may choose presentation preferences; they should not toggle low-level simulation semantics inside an active save.

## Resolution lifecycle

1. Manifest defaults are loaded.
2. Platform capability checks run.
3. Build-level overrides are applied.
4. World, profile, and session layers resolve as allowed by the general feature flag rules.
5. Requirements are enforced.
6. The platform shell assembles the boot snapshot.
7. The Wasm kernel receives an immutable capability bitset or snapshot.
8. The domain runtime records provenance for replay and migration.

The kernel does not ask for updated flag values after boot.

## Module states

A kernel module may be:

- unavailable — not compiled, not supported, or not present
- disabled — present but not enabled by the boot snapshot
- enabled — present and active for this boot
- degraded — active but using a lawful fallback because an optional dependency is missing
- incompatible — present but rejected because snapshot, save, or content-pack expectations do not match

Represent these states explicitly in diagnostics and replay metadata.

## Dependency rules

Use `requires` for hard dependencies only.

Good dependency:

- `kernel.module.snapshotReplay` requires `kernel.wasm.processCore`

Bad dependency:

- `kernel.module.topology` requires a specific content arc

Content may require a kernel capability, but the kernel should not require content.

## Content interaction

Content packs may declare required capabilities, but they must not talk directly to kernel flags.

Good content declaration:

```json
{
  "requiresCapabilities": [
    "topology.regionMembership",
    "process.recurringState"
  ]
}
```

The content compiler or domain runtime maps those capabilities to resolved flags.

Bad content declaration:

```json
{
  "ifFlag": "kernel.module.topology",
  "thenRunKernelFunction": "rewrite_edge"
}
```

Content should remain domain-authored, not backend-authored.

## Runtime query rule

The domain runtime may ask a pure query service whether a capability is available.

It should ask:

- `hasCapability("topology.regionMembership")`
- `hasCapability("snapshot.restore")`
- `hasCapability("diagnostics.kernelCounters")`

It should not scatter raw flag checks throughout game logic.

## Testing matrix

Do not attempt full combinatorial coverage.

Instead, maintain a small matrix:

| Matrix case                           | Purpose                                              |
| ------------------------------------- | ---------------------------------------------------- |
| process core only                     | prove minimal kernel boots and replays               |
| process core + diagnostics            | prove diagnostics do not change simulation semantics |
| process core + snapshot replay        | prove snapshot determinism                           |
| process core + topology               | prove graph and region capabilities are isolated     |
| process core + topology + constraints | prove combined puzzle substrate behavior             |
| disabled optional module              | prove lawful degradation                             |
| missing required module               | prove boot rejection or content occlusion            |

Every new module should add one positive case and one disabled or rejected case.

## Performance rule

Feature flags should not create expensive checks inside hot loops.

At boot, resolve flags into:

- a compact capability bitset
- module dispatch table
- static module configuration
- prevalidated dependency graph

Inside hot paths, use precomputed module availability rather than string lookup.

## Replay and migration rule

Saves and replay traces should preserve:

- feature flag manifest version
- kernel module capability snapshot
- non-default build overrides
- content-pack capability requirements
- kernel module versions when snapshot schema is involved

If a replay requires a capability that is disabled or unavailable, the runtime should fail lawfully with a diagnostic reason instead of producing a misleading replay.

## Degradation rule

Optional kernel modules must degrade into game-legible states.

Examples:

- missing topology capability -> route appears occluded or unavailable
- missing diagnostics capability -> debug panel shows unavailable counters
- missing spatial port -> spatially enhanced view falls back to symbolic representation
- missing snapshot replay -> replay inspection unavailable, but normal play continues if process core can still persist world state

Do not expose technical failure language to the player.

## Anti-patterns

Avoid:

- mutable kernel flags during active simulation
- player-facing kernel toggles
- remote flag lookups from Wasm
- content packs branching on raw kernel flag IDs
- flags that hide incomplete behavior instead of guarding unavailable capability
- module flags with no executable specification
- module combinations that cannot be replayed

## Done checklist

A kernel module flag is complete when:

- it is in `config/feature-flags.json`
- it follows the kernel field rules
- dependency requirements are explicit
- manifest validation covers it
- tests cover enabled and disabled behavior
- boot snapshot records it
- replay metadata records it when relevant
- documentation states which module owns it
- content uses capabilities rather than raw flag IDs
