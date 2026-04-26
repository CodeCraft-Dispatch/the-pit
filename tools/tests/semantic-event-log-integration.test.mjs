import test from "node:test";
import assert from "node:assert/strict";
import {
  createDeterministicTickLoop,
  replayDeterministicTicks,
  restoreDeterministicTickLoop,
} from "../../runtime/kernel/deterministic-tick-loop.mjs";

const enabledCapabilities = Object.freeze({
  values: {
    "kernel.module.diagnostics": true,
    "kernel.module.semanticEventLog": true,
    "kernel.wasm.processCore": true,
  },
  provenance: {
    "kernel.module.diagnostics": { source: "build" },
    "kernel.module.semanticEventLog": { source: "build" },
    "kernel.wasm.processCore": { source: "build" },
  },
});

const semanticLogDisabledCapabilities = Object.freeze({
  values: {
    "kernel.module.diagnostics": true,
    "kernel.module.semanticEventLog": false,
    "kernel.wasm.processCore": true,
  },
  provenance: {
    "kernel.module.diagnostics": { source: "build" },
    "kernel.module.semanticEventLog": { source: "build" },
    "kernel.wasm.processCore": { source: "build" },
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

test("records tick-loop semantic events through the semantic event log module", () => {
  const loop = createDeterministicTickLoop({
    capabilities: enabledCapabilities,
    content: content(),
  });

  const events = loop.advance(2, [command()]);

  assert.deepEqual(
    events.map((event) => [event.sequence, event.tick, event.type]),
    [
      [1, 1, "ProcessOpened"],
      [2, 1, "ProcessAdvanced"],
      [3, 1, "ProcessRecurringObserved"],
      [4, 2, "ProcessAdvanced"],
      [5, 2, "ProcessSettling"],
      [6, 2, "ProcessRecurringObserved"],
    ],
  );
  assert.deepEqual(loop.findEventsByType("ProcessSettling"), [
    {
      details: {
        processId: "archive.glass-red",
        progress: 2,
        state: "settling",
      },
      sequence: 5,
      tick: 2,
      type: "ProcessSettling",
    },
  ]);
  assert.equal(loop.getDiagnostics()?.semanticEventLog.eventCount, 6);
});

test("snapshots and restores semantic event log state without replay drift", () => {
  const original = replayDeterministicTicks({
    capabilities: enabledCapabilities,
    commandStream: [
      {
        tick: 1,
        command: command(),
      },
    ],
    content: content(),
    seed: "seed:semantic-log",
    ticks: 2,
  });

  const restored = restoreDeterministicTickLoop(original.snapshot, {
    capabilities: enabledCapabilities,
  });

  assert.deepEqual(restored.getEvents(), original.events);
  assert.deepEqual(restored.snapshot().semanticEventLog, {
    enabled: true,
    events: original.events,
    nextSequence: 7,
    schemaVersion: 1,
  });
});

test("degrades to a stale trace when semantic event logging is explicitly disabled", () => {
  const loop = createDeterministicTickLoop({
    capabilities: semanticLogDisabledCapabilities,
    content: content(),
  });

  const events = loop.advance(2, [command()]);

  assert.deepEqual(events, []);
  assert.deepEqual(loop.getEvents(), []);
  assert.equal(loop.getDiagnostics()?.semanticEventLog.enabled, false);
  assert.deepEqual(loop.snapshot().semanticEventLog, {
    enabled: false,
    events: [],
    nextSequence: 1,
    schemaVersion: 1,
  });
  assert.deepEqual(loop.getProcess("archive.glass-red"), {
    id: "archive.glass-red",
    progress: 2,
    settlesAt: 2,
    state: "settling",
  });
});
