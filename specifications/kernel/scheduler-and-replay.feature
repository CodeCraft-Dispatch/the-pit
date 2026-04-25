Feature: Kernel scheduler and replay behavior

  The WebAssembly kernel must advance processes under explicit budgets and preserve replayable state so long-running processes remain inspectable.

  Scenario: Advance active processes fairly under a limited tick budget
    Given the scheduler module is enabled
    And multiple active processes are waiting for advancement
    And the tick budget cannot complete every process in one tick
    When the scheduler advances the next fixed tick
    Then no active process monopolizes all scheduled work indefinitely
    And deferred work remains ordered for a future tick
    And budget exhaustion is visible as diagnostics when diagnostics are enabled

  Scenario: Degrade scheduler behavior when the optional scheduler is disabled
    Given process core is enabled
    And the scheduler module is disabled
    When the kernel receives a process advancement command
    Then the kernel advances only process-core behavior
    And scheduler-specific priority behavior is unavailable
    And the unavailable capability is recorded without changing process truth

  Scenario: Restore a snapshot and replay the same command stream
    Given snapshot replay is enabled
    And the kernel has produced a snapshot with a manifest version and capability snapshot
    When the host restores the snapshot and replays the same command stream
    Then the final semantic event sequence matches the original run
    And replay failure is explicit if the capability snapshot is incompatible
