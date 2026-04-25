Feature: Kernel topology and constraint primitives

  The WebAssembly kernel must support graph, region, and constraint behavior as deterministic process substrate without owning narrative meaning.

  Scenario: Answer containment queries when topology is enabled
    Given process core is enabled
    And the topology module is enabled
    And a compiled content fragment requires region membership
    When the domain runtime asks whether a process is contained by a symbolic region
    Then the kernel answers the containment query deterministically
    And the domain runtime remains responsible for player-visible map meaning

  Scenario: Occlude topology-dependent content when topology is disabled
    Given process core is enabled
    And the topology module is disabled
    And a content fragment requires route availability
    When the domain runtime resolves content capabilities
    Then the route-dependent content is marked occluded or unavailable
    And the content fragment does not branch directly on a raw kernel flag identifier

  Scenario: Reject a threshold transition without the required relation
    Given process core, topology, and constraints are enabled
    And a route has a threshold constraint
    And the current command lacks the required relation
    When the command attempts to cross the threshold
    Then the kernel emits a rejected constraint event
    And route availability remains unchanged
    And the player-facing explanation is left to the domain runtime
