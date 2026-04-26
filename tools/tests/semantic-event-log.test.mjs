import test from "node:test";
import assert from "node:assert/strict";
import { createSemanticEventLog } from "../../runtime/kernel/semantic-event-log.mjs";

const enabledCapabilities = Object.freeze({
  values: {
    "kernel.module.semanticEventLog": true,
    "kernel.wasm.processCore": true,
  },
  provenance: {
    "kernel.module.semanticEventLog": { source: "build" },
    "kernel.wasm.processCore": { source: "build" },
  },
});

const disabledCapabilities = Object.freeze({
  values: {
    "kernel.module.semanticEventLog": false,
    "kernel.wasm.processCore": true,
  },
  provenance: {
    "kernel.module.semanticEventLog": { source: "build" },
    "kernel.wasm.processCore": { source: "build" },
  },
});

test("appends semantic events with deterministic sequence, tick, and detail ordering", () => {
  const eventLog = createSemanticEventLog({
    capabilities: enabledCapabilities,
  });

  const first = eventLog.appendEvent(
    {
      details: {
        processId: "archive.glass-red",
        commandId: "cmd.open-glass-red",
      },
      type: "ProcessOpened",
    },
    { tick: 4 },
  );
  const second = eventLog.appendEvent(
    {
      details: {
        state: "recurring",
        processId: "route.north-gallery",
      },
      type: "ProcessRecurringObserved",
    },
    { tick: 4 },
  );

  assert.deepEqual(first, {
    details: {
      commandId: "cmd.open-glass-red",
      processId: "archive.glass-red",
    },
    sequence: 1,
    tick: 4,
    type: "ProcessOpened",
  });
  assert.equal(second.sequence, 2);
  assert.deepEqual(
    eventLog
      .getEvents()
      .map((event) => [event.sequence, event.tick, event.type]),
    [
      [1, 4, "ProcessOpened"],
      [2, 4, "ProcessRecurringObserved"],
    ],
  );
});

test("restores existing semantic events and rejects duplicate sequence numbers", () => {
  const eventLog = createSemanticEventLog({
    capabilities: enabledCapabilities,
    state: {
      events: [
        {
          details: { processId: "route.north-gallery" },
          sequence: 2,
          tick: 3,
          type: "ProcessRecurringObserved",
        },
        {
          details: { processId: "archive.glass-red" },
          sequence: 1,
          tick: 2,
          type: "ProcessOpened",
        },
      ],
      nextSequence: 3,
      schemaVersion: 1,
    },
  });

  assert.deepEqual(
    eventLog.getEvents().map((event) => event.sequence),
    [1, 2],
  );
  assert.equal(eventLog.getNextSequence(), 3);

  assert.throws(
    () =>
      createSemanticEventLog({
        capabilities: enabledCapabilities,
        state: {
          events: [
            {
              details: {},
              sequence: 1,
              tick: 1,
              type: "ProcessOpened",
            },
            {
              details: {},
              sequence: 1,
              tick: 2,
              type: "ProcessAdvanced",
            },
          ],
          nextSequence: 2,
        },
      }),
    /duplicate semantic event sequence 1/u,
  );
});

test("rejects unsafe event types and detail keys before they enter the log", () => {
  const eventLog = createSemanticEventLog({
    capabilities: enabledCapabilities,
  });

  assert.throws(
    () =>
      eventLog.appendEvent({
        details: {},
        type: "ProcessOpened<script>",
      }),
    /event.type must be 1-128 safe identifier characters/u,
  );

  assert.throws(
    () =>
      eventLog.appendEvent({
        details: {
          "process-id<script>": "archive.glass-red",
        },
        type: "ProcessOpened",
      }),
    /event.details key must be 1-128 safe identifier characters/u,
  );
  assert.deepEqual(eventLog.getEvents(), []);
});

test("keeps the semantic event log inert when the module is explicitly disabled", () => {
  const eventLog = createSemanticEventLog({
    capabilities: disabledCapabilities,
  });

  const emitted = eventLog.appendEvent(
    {
      details: { processId: "archive.glass-red" },
      type: "ProcessOpened",
    },
    { tick: 1 },
  );

  assert.equal(emitted, null);
  assert.deepEqual(eventLog.getEvents(), []);
  assert.deepEqual(eventLog.snapshot(), {
    enabled: false,
    events: [],
    nextSequence: 1,
    schemaVersion: 1,
  });
});

test("finds events by type without exposing mutable log state", () => {
  const eventLog = createSemanticEventLog({
    capabilities: enabledCapabilities,
  });

  eventLog.appendEvent(
    {
      details: { processId: "archive.glass-red" },
      type: "ProcessOpened",
    },
    { tick: 1 },
  );
  const openedEvents = eventLog.findEventsByType("ProcessOpened");
  openedEvents[0].details.processId = "archive.modified";

  assert.deepEqual(eventLog.findEventsByType("ProcessOpened"), [
    {
      details: { processId: "archive.glass-red" },
      sequence: 1,
      tick: 1,
      type: "ProcessOpened",
    },
  ]);
});
