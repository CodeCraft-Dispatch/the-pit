# WebAssembly Kernel Feature Specification Workflow

Use this instruction set when designing, reviewing, or implementing WebAssembly kernel features in The Pit.

## Read first

- `docs/knowledge-base/engine-architecture.md`
- `docs/knowledge-base/wasm-kernel.md`
- `docs/knowledge-base/wasm-kernel-initial-feature-specs.md`
- `docs/knowledge-base/kernel-module-flags.md`
- `docs/knowledge-base/delivery-pipeline.md`
- `docs/knowledge-base/conventional-commits.md`
- `specifications/kernel/initial-wasm-kernel.feature`

## Required sequence

1. Identify whether the behavior belongs in the kernel, domain runtime, content model, platform shell, or tools layer.
2. Reject kernel placement unless the behavior is deterministic, replayable, stable, performance-sensitive, and useful to more than one content slice.
3. Write or update the executable acceptance specification under `specifications/kernel/` before implementation.
4. Add or update commit-stage unit tests for the closest executable layer.
5. Add or update a feature flag only when the feature is a real boot-time kernel capability.
6. Preserve immutable boot-time flag resolution. Never add remote flag lookup or player-facing kernel toggles.
7. Implement the smallest slice that satisfies the acceptance spec and unit tests.
8. Refactor only after tests are green.
9. Run `npm run spec:validate`, `npm run test`, and `npm run format:check` before committing.
10. Use a Conventional Commit header that names the dominant intent.

## Kernel placement test

Ask this before moving behavior into the kernel:

> Would this behavior still be required if the UI, renderer, and content pack changed?

If yes, the behavior may belong in the kernel. If no, keep it in the platform shell, domain runtime, content model, or tools layer.

## Feature flag rules

Kernel feature flags must be hidden, build-persistent, immutable at runtime, testable, and locally resolved before boot.

Good kernel flags:

- `kernel.wasm.processCore`
- `kernel.module.scheduler`
- `kernel.module.snapshotReplay`
- `kernel.module.topology`
- `kernel.module.constraints`
- `kernel.module.diagnostics`
- `kernel.spatialPort.basicQueries`

Do not add flags such as `kernel.experimental`, `kernel.fastMode`, or content-arc toggles inside kernel modules.

## Acceptance specification rules

Acceptance scenarios should prove externally meaningful behavior, not private implementation details.

Prefer scenarios for:

- boot capability snapshot behavior
- fixed-step determinism
- command-envelope rejection
- lawful disabled-module degradation
- snapshot replay compatibility
- topology and constraint isolation
- diagnostics non-interference
- symbolic fallback when spatial capability is disabled

## Commit-stage unit-test rules

Before runtime packages exist, keep fast unit tests in `tools/tests/` for validators and manifest behavior.

When runtime packages exist, package-local unit tests must cover:

- process transition reducers
- deterministic scheduler ordering
- command envelope validation
- snapshot restore compatibility
- replay trace comparison
- feature flag provenance and dependency behavior

## Agent handoff

Use these agents together:

- `codex/agents/wasm-kernel-spec-architect.md` for kernel boundary, feature specs, and module decomposition.
- `codex/agents/quality-guardian.md` for acceptance, unit, mutation, and pipeline gates.
- `codex/agents/commit-message-steward.md` before committing or opening a PR.

## Done checklist

- The feature has an acceptance scenario under `specifications/kernel/`.
- The nearest executable unit tests run in the commit stage.
- Any new kernel flag exists in `config/feature-flags.json` and passes validation.
- Disabled or missing capability behavior degrades lawfully.
- Replay or future replay provenance is preserved.
- The knowledge base states the ownership boundary.
- The commit message follows Conventional Commits.
