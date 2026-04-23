# Engine Architecture

## Core position

The Pit should not be built as a physics-first engine with puzzle logic on top.

It should be built as a world-process engine with a subordinate spatial or physics layer.

## Five-layer architecture

### 1. Platform shell

Owns browser-facing responsibilities:

- boot and loading
- feature detection
- storage integration
- worker orchestration
- rendering adapters
- input, audio, DOM, accessibility
- feature flag manifest loading and boot snapshot assembly

### 2. Simulation kernel

Prefer a deterministic fixed-step kernel, ideally in Wasm.

Owns:

- fixed clock
- scheduler
- topology engine
- snapshot and replay hooks
- optional physics port
- immutable consumption of boot-time kernel capability flags

### 3. Domain runtime

This is the real heart of the game.

Owns:

- process engine
- knowledge model
- progression service
- contradiction controller
- self-reference controller
- faction or civic ecology state
- pure feature flag query service

### 4. Content model

Declarative authored content that describes rooms, gardens, paths, relics, oracle bargains, mirror rules, and progression gates.

It may also declare lawful flag gates for modular arcs or experimental surfaces.

### 5. Tools and pipeline

Owns:

- inspectors
- content compiler
- linter
- replay debugger
- balancing telemetry
- validation and migration tooling
- feature flag manifest validation and matrix support

## Feature flag stance

Feature flags are a local-first runtime service, not a remote control plane.

Resolve them in a stable order:

1. manifest defaults
2. build and platform capability gates
3. world and content-pack gates
4. profile and preference overrides
5. session and test overrides

### Placement rule

- The platform shell loads the manifest and composes a boot snapshot.
- The domain runtime exposes a pure read-only query surface to the rest of the engine.
- The content model may declare feature requirements without binding directly to a backend.
- The Wasm kernel receives an immutable capability snapshot or bitset at boot.

Do not let the kernel own flag persistence, profile preference storage, or remote lookup behavior.

## Missing abstractions that matter most

### Process engine

The runtime must model things that:

- open
- bloom
- settle
- recur
- drift
- proliferate
- contradict learned heuristics

That is more central than collision or rigid-body behavior.

### Knowledge model

Separate world truth from player-visible truth.

Without this, the game either spoils itself or feels arbitrary.

### Decision model

Track what the player saw, what they chose, and when consequences became legible.

### Topology model

Echoing paths and mirror spaces need graph and rewrite abstractions, not just Euclidean coordinates.

### Progression and contradiction model

The eight-phase arc should exist as a runtime service, not only as a narrative note.

## Physics stance

If a spatial or physics subsystem exists, treat it as a replaceable port.

Use it mainly for:

- occupancy
- line of sight
- region containment
- swept movement
- trigger volumes
- constraints
- topology-related queries
- diagnostic and replay support

Do not let spectacle physics become the organizing principle.

## Working rule

When in doubt, ask:

Is this feature better described as a process, a knowledge boundary, a commitment cost, a representation rule, a capability gate, or a spatial event?

If it is not fundamentally spatial, it should not live in the physics layer.
