Feature: Test-first delivery pipeline

  Scenario: A behavior change starts as an executable example
    Given a proposed change to game behavior, content semantics, or delivery workflow
    When the contributor defines the slice in a feature file before implementation
    Then the repository can enforce a test-first entry point

  Scenario: A slice is only complete after mutation testing
    Given a slice with green automated tests
    When mutation testing runs against the nearest executable domain layer
    Then the slice is not considered complete unless the mutation gate passes

  Scenario: Mainline health reacts to a red pipeline
    Given a push to main causes a delivery stage to fail
    When the workflow evaluates the mainline result
    Then the repository opens or refreshes a build-health issue until the pipeline is green again
