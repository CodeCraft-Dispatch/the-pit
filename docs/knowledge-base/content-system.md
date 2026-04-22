# Content System

## Principle

Code owns the verbs of the universe.
Content owns the authored sentences.

Do not try to replace code with a mountain of config. The point is separation of concerns, not abolition of implementation.

## What stays in code

Stable semantics should remain in code:

- scheduler
- process semantics
- persistence and migration
- replay
- contradiction timing machinery
- concurrency boundaries
- diagnostics
- rendering adapters
- interpreter behavior

## What belongs in authored content

Mutable world and narrative situations should live in content:

- rooms
- relics
- gardens
- paths
- oracle bargains
- progression gates
- contradiction triggers
- reveal thresholds
- copy and symbols
- narrative unlock conditions

## Preferred modeling language

Author content in domain language:

- views
- commands
- costs
- policies
- events
- reveals
- closures
- unlocks
- contradictions

## Example shape

```yaml
id: archive.room.014
family: archive_room
arc: patterning

views:
  entry:
    text: The inscriptions seem almost familiar.

commands:
  inspect_sigil:
    costs: { time: 1, focus: 1 }
  pull_lever_a:
    costs: { time: 1, focus: 2 }
    enabled_if: [has_bronze_key]

policies:
  - when: inspect_sigil
    emit: sigil_examined
  - when: pull_lever_a
    emit: lever_a_pulled
  - when_all: [sigil_examined, lever_a_pulled]
    emit: chamber_opened

closures:
  chamber_opened: reveal
  path_looped: recurrence
```

The syntax can change. The important thing is that the file speaks the language of the game.

## Capability boundary

Content should declare what it requires, not bind directly to a backend.

Useful capability areas include:

- topology rewrite
- recurring timer
- hidden knowledge
- commitment gate
- contradiction trigger
- replay surface
- semantic map projection

This keeps authored content portable while the runtime evolves.

## Authoring rule

Every content beat should define:

- arc
- family
- what the player sees
- what the player must commit
- what counts as progress
- how it closes
- how contradiction can target the learned method

## Anti-patterns

- leaking low-level engine details into authored files
- encoding scheduler logic in content
- writing mini-programs in the DSL to compensate for missing engine semantics
- allowing every room to invent its own private ontology

## Goal

The content system should make it easy to author many lawful local situations without forcing the engine to ossify around one-off exceptions.
