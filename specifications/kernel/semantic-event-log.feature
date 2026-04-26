Feature: Semantic event log

  The semantic event log should own deterministic event storage, event sequence
  allocation, event queries, and replayable snapshots without taking over process
  mutation, command routing, browser persistence, or player-facing meaning.

  Scenario: Append semantic events in deterministic order
    Given the boot capability snapshot enables process core and semantic event logging
    When the deterministic tick loop emits process events for a fixed tick
    Then the semantic event log assigns stable sequence numbers and tick stamps

  Scenario: Query semantic events without exposing mutable log state
    Given the semantic event log contains process-opened and process-settling events
    When the domain runtime queries events by type
    Then it receives cloned semantic events without direct access to log internals

  Scenario: Reject unsafe semantic event identifiers before projection
    Given a semantic event draft contains unsafe event type or detail key text
    When the semantic event log validates the draft
    Then the draft is rejected before it can enter replay, journal, map, or diagnostic projections

  Scenario: Preserve semantic event log snapshots for replay
    Given a deterministic tick loop has emitted semantic events
    When the kernel snapshot is captured and restored with compatible capabilities
    Then the restored log preserves event order, next sequence, schema version, and capability provenance

  Scenario: Degrade lawfully when semantic event logging is disabled
    Given the boot capability snapshot explicitly disables semantic event logging
    When the deterministic tick loop advances process state
    Then process state can still advance but the replay trace remains unavailable as an inert stale trace

  Scenario: Boot the staged Wasm semantic event log core with immutable capabilities
    Given the platform shell resolves process-core and semantic-event-log capabilities before boot
    When the Wasm semantic event log core receives the capability mask and event count
    Then it snapshots immutable capability metadata and exposes only gated event-log counts
