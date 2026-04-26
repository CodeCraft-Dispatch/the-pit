Feature: Command dispatcher

  The command dispatcher should provide modular command normalization, ordering,
  capability gating, and handler routing for the deterministic kernel without
  leaking process mutation policy back into the tick loop.

  Scenario: Dispatch process commands through registered handlers
    Given a command dispatcher with process core and command dispatcher capabilities enabled
    When the dispatcher receives a valid process command envelope
    Then it routes the command to the process command handler and returns semantic process events

  Scenario: Replay ready commands deterministically
    Given restored queued command entries with target ticks and received order values
    When the dispatcher releases commands ready for the current tick
    Then commands dispatch in target tick then received order without depending on insertion order

  Scenario: Keep queue snapshots replayable
    Given a command dispatcher receives a validated command for a future tick
    When the dispatcher snapshots queued commands
    Then the snapshot preserves command envelope, target tick, and received order only

  Scenario: Reject disabled dispatcher capability without mutating processes
    Given the boot capability snapshot explicitly disables the command dispatcher
    When a process command is ready to dispatch
    Then the dispatcher emits a command rejection and leaves process state unchanged

  Scenario: Reject disabled process core without mutating processes
    Given the boot capability snapshot enables the command dispatcher but disables process core
    When a process command is ready to dispatch
    Then the dispatcher emits a process-core command rejection and leaves process state unchanged

  Scenario: Boot the staged Wasm command-dispatcher core with immutable capabilities
    Given the platform shell resolves process-core and command-dispatcher capabilities before boot
    When the Wasm command-dispatcher core receives the capability mask and queue depth
    Then it snapshots the immutable capability mask and exposes only gated queue metadata
