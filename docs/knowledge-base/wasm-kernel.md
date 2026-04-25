# WebAssembly Kernel

## Purpose

The WebAssembly kernel is the deterministic simulation core for The Pit.

It exists to make world processes lawful, replayable, inspectable, and fast without turning the project into a conventional physics engine. The kernel should execute the small, stable semantics that must remain consistent across browsers, content packs, saves, replays, and future runtime growth.

The kernel is not the whole game engine. It is the lowest execution layer of the world-process engine.

## Kernel mission

The kernel should provide:

- deterministic fixed-step execution
- budgeted process advancement
- stable event emission
- snapshot and replay hooks
- topology and constraint primitives
- low-level capability gates
- predictable module boundaries
- a narrow host interface to TypeScript

It should make the world feel lawful even when the player cannot globally master it.

## Non-goals

The kernel must not own:

- DOM, canvas, audio, browser APIs, or accessibility surfaces
- player profile storage
- save-file storage
- remote feature flag lookup
- content authoring decisions
- narrative progression policy
- UI command handlers
- large language model calls
- payment-backed services
- web analytics or hosted telemetry

The TypeScript platform shell should own browser integration. The domain runtime should own progression, knowledge boundaries, contradiction timing, and self-reference policy. The content model should own authored situations.

## Layer ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| Platform shell | boot, loading, workers, storage, rendering adapters, feature detection, flag snapshot assembly | process semantics |
| WebAssembly kernel | fixed clock, scheduler, module execution, topology primitives, snapshots, replay hooks, deterministic low-level events | profile state, remote lookup, narrative policy |
| Domain runtime | process meaning, knowledge model, progression, contradiction, self-reference, flag queries | browser APIs or Wasm memory layout |
| Content model | rooms, gardens, paths, oracle bargains, relics, gates, authored process definitions | runtime scheduling or persistence mechanics |
| Tools and pipeline | compiler, validator, replay debugger, inspectors, test matrix, migration tools | player-facing play semantics |

## Kernel boundary

The kernel should communicate with the host through a small ABI rather than a broad object API.

Inputs:

- boot capability snapshot or bitset
- compiled content-package fragments relevant to kernel-level execution
- deterministic seed values
- fixed-step tick requests
- command envelopes from the domain runtime
- snapshot restore requests

Outputs:

- semantic kernel events
- diagnostic counters
- snapshot chunks or snapshot diffs
- replay trace fragments
- bounded failure reports

The host should translate browser and UI details into domain commands before anything reaches the kernel.

## Required kernel features

### Fixed-step clock

Run simulation on a fixed tick. Variable frame time may affect rendering, but not world-process meaning.

Minimum behaviors:

- accept tick count or step request from host
- process commands at deterministic tick boundaries
- support pause, resume, snapshot, restore, and replay
- expose tick budget and overrun diagnostics

### Scheduler

Advance active processes under explicit budgets.

The scheduler should support:

- process queues
- priority classes
- fairness constraints
- deterministic ordering
- bounded work per tick
- deferred work queues
- starvation diagnostics

The scheduler must make non-resolving or long-running processes observable without freezing the game.

### Process core

Model process states such as:

- dormant
- opened
- advancing
- waiting
- blooming
- settling
- recurring
- drifting
- proliferating
- exhausted
- mutated
- occluded

The process core should not decide narrative meaning. It should emit events that the domain runtime interprets.

### Topology core

Support graph and region operations that make Echoing Paths, Mirror spaces, transit logic, and map-mediated play possible.

Minimum primitives:

- nodes and edges
- region membership
- route availability
- rewrite markers
- traversal constraints
- query surfaces for reachability and containment

### Constraint core

Support constraints without becoming a physics spectacle system.

Useful primitives:

- occupancy
- relation constraints
- lock and threshold constraints
- trigger volumes
- line-of-sight or visibility gates where needed
- monotonic and reversible constraint transitions

### Snapshot and replay

Replay is core architecture.

The kernel should provide:

- compact snapshots
- deterministic restore
- event sequence identifiers
- replay trace emission
- manifest and capability version stamping
- failure mode when replay input does not match boot capabilities

### Diagnostics

Diagnostics should be toggleable and zero-cost when disabled.

Useful counters:

- tick duration
- process count
- queue depth
- allocations or memory pressure where observable
- snapshot size
- event volume
- module execution budget
- rejected or disabled module calls

## Module model

The kernel should be built from modules that expose small capabilities.

Recommended first modules:

1. `process-core` — process state transitions and process queues
2. `scheduler` — tick ordering, budgets, fairness, deferred work
3. `topology` — graph, route, region, and rewrite primitives
4. `constraints` — occupancy, threshold, relation, and trigger constraints
5. `snapshot-replay` — snapshot, restore, and trace emission
6. `diagnostics` — performance counters and debug event surfaces
7. `spatial-port` — optional spatial query adapter, not a full physics engine

Each module should declare:

- owned state
- command types accepted
- event types emitted
- snapshot schema
- feature flag gate
- dependencies
- deterministic test cases
- degradation behavior when disabled

## Extension rule

A new kernel module is allowed only when the behavior is:

- stable enough to become part of the runtime semantics
- performance-sensitive enough to benefit from Wasm
- deterministic enough to replay
- small enough to test independently
- useful to more than one content slice

If the behavior is primarily narrative policy, UI state, profile preference, or authoring convenience, it belongs outside the kernel.

## Feature flag rule

Kernel feature flags are boot-time capability gates.

The kernel may consume resolved flags, but it must not resolve them. The platform shell resolves the manifest and host capability checks before boot. The kernel receives an immutable snapshot.

Good kernel flag examples:

- `kernel.wasm.processCore`
- `kernel.module.topology`
- `kernel.module.snapshotReplay`
- `kernel.module.diagnostics`
- `kernel.spatialPort.basicQueries`

Bad kernel flag examples:

- `ui.showAdvancedJournal`
- `content.arc.oracleDebt`
- `player.hintDensity`
- `remote.rollout.experimentalKernel`

The kernel must never depend on a hosted flag service.

## Keeping the kernel free

The kernel should remain free by defaulting to:

- Rust or another open-source Wasm-compatible language and toolchain
- browser-native WebAssembly
- open-source test runners and build tools
- GitHub Actions free-tier workflows where available
- Netlify or equivalent free static hosting for browser delivery
- local files, IndexedDB, OPFS, and export/import saves rather than paid storage
- local diagnostics instead of paid observability platforms

Any tool or service that introduces recurring cost must be treated as an architecture decision, not a casual dependency.

## Keeping the kernel flexible

Flexibility comes from stable contracts, not from making everything dynamic.

Use:

- narrow ABI boundaries
- declarative module manifests
- versioned snapshot schemas
- feature-gated module activation
- host-owned capability detection
- content compiler validation
- semantic events rather than backend-specific callbacks
- degradation states for disabled optional modules

Avoid:

- UI handlers calling kernel internals directly
- content files containing arbitrary executable logic
- module flags that silently change semantics mid-save
- backend-specific APIs leaking into the domain runtime
- shared mutable state across modules without ownership rules

## Keeping the kernel modular and extendable

A module should feel like a deep component: small interface, meaningful internal capability.

A good module hides its internal data layout and exposes only:

- supported commands
- emitted events
- query functions
- snapshot hooks
- diagnostics hooks
- dependency declarations

A bad module exposes implementation details, requires unrelated modules to know its memory layout, or forces content authors to think in backend terms.

## Minimal viable kernel

The first viable Wasm kernel should do only this:

1. boot with an immutable capability snapshot
2. accept deterministic tick requests
3. accept a small command envelope
4. advance a small set of process states
5. emit semantic events
6. produce and restore a snapshot
7. support a replay of the same command stream
8. expose basic diagnostics under a hidden flag

Do not add topology rewrites, spatial queries, or complex scheduler policy until the process core proves the contract.

## Acceptance criteria

A kernel slice is not done until:

- there is an executable specification for the behavior
- deterministic replay passes for the same seed and command stream
- disabled module behavior degrades lawfully
- enabled module behavior is covered by domain-level tests
- feature flag provenance is recorded in the boot snapshot
- mutation testing or equivalent negative testing has challenged the decision logic
- documentation states the module boundary and ownership

## Working question

Before moving behavior into the kernel, ask:

Would this behavior still be needed if the UI, content pack, and renderer changed?

If yes, it may belong in the kernel. If no, keep it higher in the stack.
