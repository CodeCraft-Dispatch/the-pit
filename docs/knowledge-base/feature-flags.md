# Feature Flags

## Principle

Feature flags in The Pit must be local-first, zero-cost, and architecture-aware.

Do not add a hosted flag service.
Do not treat flags as a remote control plane.
Do not let flags become an excuse to hide broken semantics.

The purpose of flags here is to:

- stage runtime growth safely
- gate modular content and game arcs lawfully
- expose a small player-safe subset through settings and preferences
- allow deterministic testing and session override in development
- pass an immutable capability snapshot into the engine and Wasm kernel

## Flag categories

Use a small, explicit taxonomy:

- `engine` — runtime services, projections, diagnostics, or migration behavior
- `ui` — player-facing or operator-facing surfaces
- `content` — authored game arcs, puzzle families, or content-pack gates
- `kernel` — low-level simulation or Wasm capability gates

## Exposure rule

Not every flag belongs in the UI.

Useful exposure classes are:

- `hidden` — internal staging, diagnostics, or rollout support
- `player` — safe preference-like flags the player may toggle intentionally
- `operator` — local development or debugging flags that should not appear in player settings

A player-facing surface must never expose hidden engine or kernel flags casually.

## Persistence rule

Every flag must declare where its non-default value may live:

- `build` — decided before runtime or by platform capability detection
- `profile` — stored with player preferences
- `world` — stored in a specific save or content-pack context

Session overrides for testing are allowed, but they are ephemeral and should not silently persist.

## Resolution order

Resolve flags in a stable order:

1. manifest defaults
2. build and platform capability overrides
3. world and content-pack overrides
4. profile and preference overrides
5. session and test overrides

This order should be deterministic and replayable.

## Manifest shape

Keep the source of truth in a repository-owned manifest.

Suggested location:

- `config/feature-flags.json`

Each flag should declare at least:

- `id`
- `kind`
- `description`
- `default`
- `exposure`
- `persistence`
- `mutableAtRuntime`
- `testable`
- optional `requires`
- optional `tags`

## Runtime placement

### Platform shell

Owns:

- manifest loading
- platform capability detection
- session override injection for tests and development
- profile preference storage
- boot-time flag snapshot assembly

### Domain runtime

Owns:

- a pure flag query service
- lawful gating of progression, projections, and diagnostics
- flag provenance for replay and migration

### Content model

Owns:

- declarative flag gates for modular arcs, puzzle families, and authored situations

### Wasm kernel

The kernel should receive a boot-time capability snapshot or bitset.

It should not perform remote lookups.
It should not own persistence.
It should not decide player-facing settings.

## UI rule

Player settings may expose only flags that are:

- explicitly marked `player`
- stored in profile state
- safe to toggle without corrupting a save
- explainable in player language

Useful examples include representation or preference surfaces.
Do not expose structural content migration flags or kernel internals as casual toggles.

## Content rule

Use content flags to gate modular additions such as:

- a new district
- a new puzzle family
- an alternate oracle surface
- an experimental contradiction cadence

Flags should select among lawful authored situations, not patch over missing engine semantics.

## Testing rule

Every new flag requires:

- an executable specification that explains why it exists
- manifest validation
- domain-level tests for resolution and override rules
- mutation testing of the evaluation logic

As runtime packages arrive, add matrix tests for important combinations rather than exploding into full combinatorial coverage.

## Working rule

A good feature flag in The Pit preserves a stable semantic core while allowing a controlled difference in visibility, capability, or authored availability.

If a proposal turns flags into a substitute for design clarity, remove the flag and fix the underlying model instead.
