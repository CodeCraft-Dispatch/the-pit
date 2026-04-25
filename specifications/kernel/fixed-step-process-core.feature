Feature: Fixed-step process core

  The WebAssembly kernel must advance world processes on deterministic ticks so lawful process behavior survives browser frame variance.

  Scenario: Emit the same events for the same fixed-step command stream
    Given the kernel has booted with process core enabled
    And the host provides the same deterministic seed
    And the domain runtime provides the same command stream
    When the host advances the kernel by the same fixed tick count twice
    Then both runs emit the same semantic event sequence
    And each event includes a deterministic tick and sequence identifier

  Scenario: Open a dormant process through a command envelope
    Given a dormant process exists in compiled kernel-relevant content
    And the domain runtime sends a lawful open process command envelope
    When the kernel processes the command at the next deterministic tick
    Then the process enters an opened or advancing state
    And the kernel emits a semantic process event rather than a UI event

  Scenario: Keep a recurring process observable without freezing play
    Given a process has entered a recurring state
    And the host continues to request fixed ticks
    When the process does not settle within the current tick budget
    Then the kernel preserves the process as observable work
    And the kernel continues accepting future tick requests
    And the domain runtime can project the process as unresolved without calling it a bug
