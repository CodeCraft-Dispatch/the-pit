Feature: Process state container

  The process state container should provide modular process-state ownership for
  the deterministic kernel while staying behind immutable boot-time process-core
  capabilities.

  Scenario: Normalize process definitions into a deterministic container
    Given authored process definitions with valid identifiers and optional state fields
    When the kernel creates the process state container
    Then the container stores normalized process records in deterministic snapshot order

  Scenario: Apply process commands without leaking mutation policy into the tick loop
    Given a process state container with dormant and recurring processes
    When the deterministic tick loop applies validated process command envelopes
    Then the container emits semantic process events and owns process state mutation

  Scenario: Reject invalid process definitions before simulation
    Given a process definition with duplicate or unsafe identifiers
    When the kernel creates the process state container
    Then the container rejects the definition before any tick can execute

  Scenario: Keep process-state behavior behind process-core capability flags
    Given the boot capability snapshot disables process core
    When the deterministic tick loop or Wasm process-state core is advanced
    Then process-state behavior remains inert and no process state is mutated

  Scenario: Boot the staged Wasm process-state core with immutable capabilities
    Given the platform shell resolves process-core capability before boot
    When the Wasm process-state core receives the capability mask and process count
    Then it snapshots the immutable capability mask and exposes only gated process metadata
