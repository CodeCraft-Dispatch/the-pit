# Engineering Foundations

## Purpose

This document defines the engineering doctrine for The Pit.

It exists to keep delivery, design, testing, and implementation aligned with the project's hidden thesis while staying practical, incremental, and zero-cost.

## Core engineering stance

- Prefer declarative, functional, and data-oriented design.
- Use reactive thinking where it clarifies time, feedback, and event flow.
- Follow CUPID properties: composable, Unix-like in responsibility, predictable, idiomatic, and domain-based.
- Apply continuous delivery principles from the start, even while the repo is still knowledge-base heavy.
- Treat documentation, executable specifications, tests, mutation gates, and build health as part of implementation.
- Refuse tooling or processes that introduce monetary cost to specification, design, development, testing, operations, or play.

## Development loop

The default loop is:

`specify -> make the example fail -> make the smallest change pass -> refactor on green -> mutate -> build -> review`

That implies:

1. Start with specification by example.
2. Keep changes slice-sized.
3. Prefer red-green-refactor over large design jumps.
4. Refactor ruthlessly only when all relevant tests are green.
5. Run mutation testing after the relevant automated tests pass.
6. Keep the build releasable at all times.

## Executable specification rule

No behavior starts in implementation code.

Every behavior change begins as a cucumber-like feature example under `specifications/`.

Those examples should use domain language and a thin DSL-style step vocabulary rather than raw arrange-act-assert mechanics.

## Testing portfolio

Use the smallest effective mix of automated tests:

- executable specifications for behavior and examples
- unit tests for stable domain logic
- property or model-based tests for process rules and invariants
- integration tests for persistence, projections, and runtime services
- replay tests for time and contradiction behavior
- content validation tests for authored data
- feature flag manifest and resolution tests for capability gating
- accessibility, performance, and security checks where relevant

## Mutation rule

All automated testing is followed by mutation testing at the nearest executable domain layer.

Practical interpretation:

- feature and acceptance tests should drive domain behavior
- the corresponding domain logic must survive a mutation gate
- unit and property tests are followed directly by mutation
- integration and replay tests require mutation of the domain or service code they exercise
- feature flag evaluation logic must survive mutation at the pure resolution layer

Do not use broad end-to-end mutation as an excuse to skip domain-level mutation.

## Feature flag doctrine

Feature flags must remain local-first, zero-cost, and semantically honest.

That means:

- no paid or hosted flag control plane
- every new flag gets an executable example, manifest entry, validation, and tests
- flags stage or expose capability; they do not replace missing architecture
- player-facing flags must be profile-backed and safe to toggle
- session and test overrides must stay ephemeral unless deliberately persisted
- expired or fully adopted flags should be removed instead of living forever

## Build health rule

Never normalize a broken build.

A red pipeline is an immediate defect in the delivery system.

The repository must:

- detect failure automatically
- surface failure immediately
- react automatically on mainline failure
- return to green before further expansion

## Delivery principle

The entire lead time should be represented in the delivery pipeline:

- specification contract
- repository and canon validation
- automated tests
- mutation gate
- build and publish surface
- mainline health reaction

As implementation grows, future app packages plug into the same staged contract rather than bypassing it.

## Design and implementation guidance

- Build incrementally and iteratively.
- Prefer deep, composable modules over shallow wrappers.
- Keep domain semantics in code and authored situations in content.
- Use small, observable commits that keep the system releasable.
- Run tests and builds frequently during specification, design, implementation, and refactoring.
- Prefer a DSL or helper layer in tests instead of scattering raw setup logic across test files.

## Zero-cost tooling rule

Default to open-source tools and built-in platform capabilities.

If a proposal requires ongoing spend to specify, build, test, ship, operate, or play the game, reject it unless the doctrine is explicitly revised.
