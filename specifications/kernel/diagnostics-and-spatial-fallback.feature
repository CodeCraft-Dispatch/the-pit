Feature: Kernel diagnostics and spatial fallback

  Diagnostics and optional spatial behavior must help inspection without changing process truth or making physics the organizing principle.

  Scenario: Emit diagnostics without changing semantic events
    Given process core and diagnostics are enabled
    And the host provides a deterministic seed and command stream
    When the kernel advances through fixed ticks
    Then diagnostics expose process count, queue depth, event volume, and rejected module call counts
    And the semantic event sequence matches the same run with diagnostics disabled

  Scenario: Hide diagnostic counters when diagnostics are disabled
    Given process core is enabled
    And diagnostics are disabled
    When the host requests diagnostic counters
    Then diagnostic counters are unavailable
    And simulation state remains unchanged

  Scenario: Fall back to symbolic representation when spatial queries are disabled
    Given process core and topology are enabled
    And the spatial port is disabled
    And a content surface has a spatial enhancement
    When the domain runtime resolves available capabilities
    Then the content remains playable through symbolic representation
    And process truth does not depend on a concrete spatial backend
    And no backend-specific spatial API leaks into the domain runtime
