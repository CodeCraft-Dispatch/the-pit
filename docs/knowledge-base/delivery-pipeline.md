# Delivery Pipeline

## Goal

Represent the whole engineering lead time in GitHub automation so that specification, testing, mutation, build, and release-readiness are visible and enforceable.

## Stages

### 1. Specification and contract

Validate executable specifications and the repository contract first.

Purpose:

- no behavior without examples first
- no silent drift in repo structure or engineering doctrine

### 2. Knowledge-base quality

Check formatting and markdown quality.

Purpose:

- keep doctrine legible
- treat docs as implementation assets, not decoration

### 3. Executable tests

Run the fast automated tests that validate the current engineering utilities and, later, domain code.

Purpose:

- preserve fast feedback
- catch regressions before mutation and build

### 4. Mutation gate

Run mutation testing after automated tests are green.

Purpose:

- detect weak assertions
- prevent false confidence from shallow tests

### 5. Build and publish surface

Build the current Netlify-facing knowledge surface.

Purpose:

- keep the repository continuously publishable
- prove that the docs and spec surfaces remain consumable

### 6. Mainline health reaction

When `main` goes red, open or refresh a build-health issue automatically.
When `main` returns to green, close that issue automatically.

Purpose:

- never accept a broken build as normal
- make failure operationally visible without waiting for manual triage

## Working rules

- The pipeline is ordered, not a bag of unrelated checks.
- Later stages do not excuse earlier-stage failures.
- New packages must plug into the same staged pipeline instead of inventing side workflows.
- A feature is not complete if it bypasses specification, mutation, or build visibility.

## Future extension points

As the runtime grows, extend the same pipeline with:

- typechecking
- property tests
- integration tests
- replay tests
- content-pack validation
- security checks
- performance budgets
- accessibility verification

Do not create a separate “real pipeline later.” This is the real pipeline, grown incrementally.
