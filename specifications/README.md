# Specifications

This directory holds cucumber-like executable specifications for The Pit.

## Working rule

No new behavior starts in implementation code.

Every behavior slice starts here first as a small, concrete, example-driven specification that names:

- the design pressure
- the player-visible behavior
- the commitment cost or constraint
- the expected outcome

## Style rules

- Keep scenarios small and slice-sized.
- Prefer domain language over engine jargon.
- Use declarative phrases that will later map onto a small DSL or step layer.
- Avoid embedding arrange-act-assert mechanics directly into scenarios.
- Write the example first, make it fail, make it pass, then refactor only on green.

## Minimum shape

Every feature file must include at least one:

- `Feature:` title
- `Scenario:` title
- `Given` step
- `When` step
- `Then` step

## Mutation rule

After the relevant automated tests are green, run mutation testing against the nearest executable domain layer before considering the slice done.
