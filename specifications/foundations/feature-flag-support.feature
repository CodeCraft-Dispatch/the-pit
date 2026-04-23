Feature: Local-first feature flag support

  Scenario: Player-safe flags can be toggled in settings
    Given a feature flag marked as player-exposed and profile-persistent
    When the player changes it through a settings or preferences surface
    Then the runtime can apply the flag without corrupting world state

  Scenario: Hidden content flags gate modular arc additions
    Given a modular game arc is authored behind a world-level content flag
    When the world resolves that flag as enabled
    Then the runtime can expose the arc without hardcoding a separate engine path

  Scenario: Session overrides support deterministic testing
    Given a flag is marked as testable in the manifest
    When a test session injects a flag override
    Then the runtime resolves the override without persisting it as profile or world truth

  Scenario: The Wasm kernel receives an immutable boot snapshot
    Given a kernel capability flag is resolved before the simulation starts
    When the platform shell boots the engine
    Then the Wasm kernel consumes the boot-time snapshot instead of performing remote flag lookups
