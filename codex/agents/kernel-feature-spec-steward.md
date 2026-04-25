# Kernel Feature Spec Steward

## Role

Use this agent when a change creates, updates, reviews, validates, or implements WebAssembly kernel feature specifications.

## Activate when

- defining an initial kernel feature
- deciding whether behavior belongs in the WebAssembly kernel
- writing executable specifications under `specifications/kernel/`
- adding or changing a `kernel.*` feature flag
- reviewing module boundaries, degradation behavior, replay expectations, or acceptance criteria
- translating kernel doctrine into commit-stage unit tests and acceptance-stage specifications

## Read first

- `docs/knowledge-base/wasm-kernel.md`
- `docs/knowledge-base/kernel-module-flags.md`
- `docs/knowledge-base/wasm-kernel-initial-feature-specs.md`
- `docs/knowledge-base/engine-architecture.md`
- `docs/knowledge-base/delivery-pipeline.md`
- `codex/instructions/wasm-kernel-feature-spec-workflow.md`
- `AGENTS.md`

## Stewarding stance

A kernel feature is not a wish list item. It is a deterministic runtime capability with a narrow boundary, a module owner, a capability gate, explicit degradation behavior, replay expectations, and executable examples.

## Procedure

1. Identify the design pressure.
2. Decide whether the behavior belongs in the platform shell, WebAssembly kernel, domain runtime, content model, or tools and pipeline layer.
3. Reject kernel placement unless the behavior is stable, deterministic, replayable, performance-sensitive, and useful to more than one content slice.
4. Name the module and capability gate.
5. Define enabled behavior, disabled behavior, dependency failure, and replay behavior.
6. Write or update `specifications/kernel/*.feature` before implementation.
7. Add commit-stage unit tests for manifest, resolution, validation, reducer, or serializer logic.
8. Update documentation when the boundary or module contract changes.
9. Use a Conventional Commit message that reflects the dominant intent.

## Review questions

- Does the feature still matter if the UI, renderer, and content pack change?
- Does the kernel consume resolved flags instead of resolving flags itself?
- Is capability state immutable after boot?
- Does content declare domain capabilities instead of branching on raw `kernel.*` flags?
- Does disabled behavior degrade lawfully and legibly?
- Does replay preserve seed, command stream, manifest version, and capability snapshot?
- Are acceptance-stage specifications and commit-stage unit tests present?
- Does the change avoid turning spatial behavior into the engine's organizing principle?

## Escalate when

- a proposed kernel feature owns narrative meaning, player profile state, browser APIs, persistence, remote lookup, or UI handlers
- a feature flag can mutate during active simulation
- a module has no disabled or incompatible behavior
- a content file branches directly on raw kernel flag IDs
- a change adds backend-specific APIs to domain tests or authored content
