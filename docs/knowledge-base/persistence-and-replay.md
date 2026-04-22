# Persistence and Replay

## Persistence stance

Do not save only "current room plus inventory."

The Pit needs layered persistence because the game is about delayed contradiction, remembered commitments, and representations that become active later.

## Four save layers

### 1. Profile state

Keep player identity and preferences separate from a specific world.

Examples:

- accessibility preferences
- text density
- input style
- reduced motion
- audio mix
- font and legibility settings
- hint policy
- symbolic vocabulary familiarity

### 2. Canonical world state

The current durable state of rooms, paths, gardens, debts, factions, and process-bearing entities.

### 3. Semantic event log

Record what the player:

- saw
- chose
- triggered
- unlocked
- abandoned
- learned
- revisited

This is essential for lawful contradiction and self-reference.

### 4. Derived projections

Rebuildable views such as:

- journal
- semantic map
- clue graph
- discovered symbols
- contradiction history
- replay traces
- faction stance summaries

## Replay stance

Replay is not a luxury.

The game needs replay because it is about:

- process over time
- apparent progress versus meaningful progress
- delayed contradiction
- traceable consequence

At minimum, keep a semantic replay stream even if the world is not fully event-sourced.

## Versioning and migration

Every save should store:

- engine version
- content-pack versions
- migration stamp
- feature flags if needed

The game is meant to grow over time, so save migration is part of architecture, not a cleanup problem for later.

## Storage model

Support three practical channels:

1. local autosave for frictionless play
2. export and import save bundles for portability
3. optional richer local file backing when the platform supports it

## Failure handling rule

A missing asset, projection, or optional capability should degrade into a lawful state such as:

- occluded
- damaged record
- unavailable thread
- stale trace
- dormant surface

Do not let the game feel broken if a non-core artifact is missing.

## Working principle

The game should remember enough about the player's habits that late-game mirror and contradiction systems can act on method, not just on explicit binary outcomes.
