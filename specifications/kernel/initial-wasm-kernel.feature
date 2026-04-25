Feature: Initial WebAssembly kernel capabilities

  The WebAssembly kernel should provide deterministic, modular world-process
  behavior without owning browser integration, player-facing meaning, or content
  authoring policy.

  Scenario: Boot with an immutable capability snapshot
    Given the platform shell has resolved kernel capabilities before boot
    When the WebAssembly kernel receives the boot snapshot
    Then the kernel records module availability without resolving remote flags

  Scenario: Replay the same fixed-step command stream deterministically
    Given the same seed, capability snapshot, and domain command stream
    When the host advances the kernel by the same fixed tick count twice
    Then the emitted semantic event sequence is identical

  Scenario: Reject malformed command envelopes at the kernel boundary
    Given a command envelope that contains browser UI details
    When the kernel validates the envelope at a deterministic tick boundary
    Then the command is rejected without changing process state

  Scenario: Advance long-running processes without freezing play
    Given a dormant process with a lawful open command
    When the process core advances one fixed tick
    Then the process emits a semantic event and remains observable

  Scenario: Degrade lawfully when an optional module is disabled
    Given a content capability that requires topology
    When the boot snapshot disables the topology module
    Then topology-dependent content is occluded rather than executed incorrectly
