import test from "node:test";
import assert from "node:assert/strict";
import { createDeterministicTickLoop } from "../../runtime/kernel/deterministic-tick-loop.mjs";
import { createJournalMapProjectionShell } from "../../runtime/projections/journal-map-projection-shell.mjs";

const enabledCapabilities = Object.freeze({
  values: {
    "engine.projection.journalMap": true,
    "kernel.module.commandDispatcher": true,
    "kernel.module.semanticEventLog": true,
    "kernel.wasm.processCore": true,
  },
  provenance: {
    "engine.projection.journalMap": { source: "build" },
    "kernel.module.commandDispatcher": { source: "build" },
    "kernel.module.semanticEventLog": { source: "build" },
    "kernel.wasm.processCore": { source: "build" },
  },
});

const projectionDisabledCapabilities = Object.freeze({
  values: {
    "engine.projection.journalMap": false,
    "kernel.module.commandDispatcher": true,
    "kernel.module.semanticEventLog": true,
    "kernel.wasm.processCore": true,
  },
});

const semanticLogDisabledCapabilities = Object.freeze({
  values: {
    "engine.projection.journalMap": true,
    "kernel.module.commandDispatcher": true,
    "kernel.module.semanticEventLog": false,
    "kernel.wasm.processCore": true,
  },
});

function content() {
  return {
    processes: [
      {
        id: "archive.glass-red",
        settlesAt: 2,
        state: "dormant",
      },
      {
        id: "route.north-gallery",
        state: "recurring",
      },
    ],
  };
}

function command() {
  return {
    id: "cmd.open-glass-red",
    processId: "archive.glass-red",
    type: "openProcess",
  };
}

test("projects semantic events into deterministic journal entries and map nodes", () => {
  const loop = createDeterministicTickLoop({
    capabilities: enabledCapabilities,
    content: content(),
  });
  const events = loop.advance(2, [command()]);

  const projection = createJournalMapProjectionShell({
    capabilities: enabledCapabilities,
  });
  const projected = projection.projectEvents(events);

  assert.deepEqual(
    projected.journalEntries.map((entry) => [
      entry.sequence,
      entry.tick,
      entry.eventType,
      entry.processId,
      entry.commandId,
    ]),
    [
      [1, 1, "ProcessOpened", "archive.glass-red", "cmd.open-glass-red"],
      [2, 1, "ProcessAdvanced", "archive.glass-red", null],
      [3, 1, "ProcessRecurringObserved", "route.north-gallery", null],
      [4, 2, "ProcessAdvanced", "archive.glass-red", null],
      [5, 2, "ProcessSettling", "archive.glass-red", null],
      [6, 2, "ProcessRecurringObserved", "route.north-gallery", null],
    ],
  );
  assert.deepEqual(projected.semanticMap.nodes, [
    {
      eventTypes: ["ProcessOpened"],
      firstSequence: 1,
      id: "cmd.open-glass-red",
      kind: "command",
      lastSequence: 1,
      lastTick: 1,
    },
    {
      eventTypes: ["ProcessAdvanced", "ProcessOpened", "ProcessSettling"],
      firstSequence: 1,
      id: "archive.glass-red",
      kind: "process",
      lastSequence: 5,
      lastTick: 2,
    },
    {
      eventTypes: ["ProcessRecurringObserved"],
      firstSequence: 3,
      id: "route.north-gallery",
      kind: "process",
      lastSequence: 6,
      lastTick: 2,
    },
  ]);
  assert.deepEqual(projected.semanticMap.edges, [
    {
      firstSequence: 1,
      from: "cmd.open-glass-red",
      id: "edge.1",
      lastSequence: 1,
      lastTick: 1,
      to: "archive.glass-red",
      type: "command.target",
    },
  ]);
});

test("snapshots and restores journal and map projection state without duplicates", () => {
  const loop = createDeterministicTickLoop({
    capabilities: enabledCapabilities,
    content: content(),
  });
  const events = loop.advance(2, [command()]);
  const original = createJournalMapProjectionShell({
    capabilities: enabledCapabilities,
    events,
  });

  const restored = createJournalMapProjectionShell({
    capabilities: enabledCapabilities,
    state: original.snapshot(),
  });
  restored.projectEvents(events);

  assert.deepEqual(restored.snapshot(), original.snapshot());
  assert.deepEqual(restored.getDiagnostics(), {
    enabled: true,
    journalEntryCount: 6,
    lastSequence: 6,
    mapEdgeCount: 1,
    mapNodeCount: 3,
    projectionFlag: "engine.projection.journalMap",
    schemaVersion: 1,
  });
});

test("rejects unsafe identifiers before journal or map projection", () => {
  const projection = createJournalMapProjectionShell({
    capabilities: enabledCapabilities,
  });

  assert.throws(
    () =>
      projection.projectEvents([
        {
          details: {
            processId: "archive.<script>",
          },
          sequence: 1,
          tick: 1,
          type: "ProcessOpened",
        },
      ]),
    /event\.details processId must be 1-128 safe identifier characters/u,
  );
  assert.deepEqual(projection.getJournalEntries(), []);
  assert.deepEqual(projection.getSemanticMap(), { edges: [], nodes: [] });
});

test("degrades to inert projections when projection or semantic logging is disabled", () => {
  const events = [
    {
      details: { processId: "archive.glass-red" },
      sequence: 1,
      tick: 1,
      type: "ProcessOpened",
    },
  ];

  for (const capabilities of [
    projectionDisabledCapabilities,
    semanticLogDisabledCapabilities,
  ]) {
    const projection = createJournalMapProjectionShell({
      capabilities,
      events,
    });

    assert.deepEqual(projection.getJournalEntries(), []);
    assert.deepEqual(projection.getSemanticMap(), { edges: [], nodes: [] });
    assert.equal(projection.getDiagnostics().enabled, false);
    assert.deepEqual(projection.snapshot(), {
      enabled: false,
      journalEntries: [],
      lastSequence: 0,
      schemaVersion: 1,
      semanticMap: { edges: [], nodes: [] },
    });
  }
});
