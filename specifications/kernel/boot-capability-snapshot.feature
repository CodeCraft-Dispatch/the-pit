Feature: Kernel boot capability snapshot

  The WebAssembly kernel must boot from an immutable capability snapshot so deterministic runtime semantics do not change during active simulation.

  Scenario: Boot process core from resolved capabilities
    Given the platform shell has resolved a boot snapshot with engine runtime flags enabled
    And the boot snapshot enables the process core capability
    When the host boots the WebAssembly kernel with that snapshot
    Then the kernel reports process core as available
    And the kernel does not perform a remote feature flag lookup
    And the replay metadata records the capability provenance

  Scenario: Reject profile attempts to enable kernel modules
    Given the feature flag manifest defines process core as a hidden build-persistent kernel capability
    And a player profile attempts to enable the process core capability
    When the platform shell resolves the boot snapshot
    Then the profile override is rejected
    And the kernel receives the manifest default or build-resolved value only

  Scenario: Disable a dependent module when process core is absent
    Given the scheduler module requires process core
    And the boot snapshot disables process core
    When the platform shell resolves kernel module availability
    Then the scheduler module is disabled by dependency enforcement
    And the disabled reason is available to diagnostics and replay metadata
