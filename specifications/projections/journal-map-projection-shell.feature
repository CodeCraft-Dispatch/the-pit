Feature: Journal and map projection shell

  The journal and map projection shell should consume cloned semantic events and
  derive deterministic player-facing projection state without owning kernel
  event storage, browser persistence, UI rendering, or narrative policy.

  Scenario: Project semantic events into journal entries and map nodes
    Given the semantic event log contains process and command events
    When the projection shell consumes the events
    Then it creates deterministic journal entries, process nodes, command nodes, and command-target edges

  Scenario: Preserve projection snapshots for replay and restore
    Given the projection shell has consumed semantic events
    When the projection snapshot is restored with compatible capabilities
    Then the journal entries, map nodes, map edges, and last projected sequence remain stable

  Scenario: Reject unsafe projection identifiers before player-facing surfaces
    Given a semantic event contains unsafe process or command identifiers
    When the projection shell attempts to build journal or map projections
    Then the event is rejected before it can reach journal, map, replay, or diagnostic surfaces

  Scenario: Degrade lawfully when projection or semantic logging is disabled
    Given the boot capability snapshot disables the journal map projection or semantic event log
    When semantic events are offered to the projection shell
    Then it exposes inert empty journal and semantic map projections
