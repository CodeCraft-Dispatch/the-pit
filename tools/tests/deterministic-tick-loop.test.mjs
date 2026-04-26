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
    "kernel.wasm.processCore": true,
  },
  provenance: {
    "kernel.module.diagnostics": { source: "build" },
    "kernel.wasm.processCore": { source: "build" },
  },
});

const disabledCapabilities = Object.freeze({
  values: {
    "kernel.module.diagnostics": true,
    "kernel.wasm.processCore": false,
  },
  provenance: {
    "kernel.module.diagnostics": { source: "build" },
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

function commandStream() {
  return [
    {
      tick: 1,
      command: {
        id: "cmd.open-glass-red",
        processId: "archive.glass-red",
        type: "openProcess",
      },
    },
  ];
}

test("emits identical semantic events for the same tick and command stream", () => {
  const firstRun = replayDeterministicTicks({
    capabilities: enabledCapabilities,
    commandStream: commandStream(),
    content: content(),
    seed: "seed:fixed",
    ticks: 3,
  });
  const secondRun = replayDeterministicTicks({
    capabilities: enabledCapabilities,
    commandStream: commandStream(),
    content: content(),
    seed: "seed:fixed",
    ticks: 3,
  });

  assert.deepEqual(firstRun.events, secondRun.events);
  assert.deepEqual(
    firstRun.events.map((event) => [event.tick, event.sequence, event.type]),
    secondRun.events.map((event) => [event.tick, event.sequence, event.type]),
  );
});

test("opens and advances dormant processes through command envelopes", () => {
  const loop = createDeterministicTickLoop({
    capabilities: enabledCapabilities,
    content: content(),
  });

  const events = loop.advance(2, [commandStream()[0].command]);

  assert.deepEqual(
    events.map((event) => event.type),
    [
      "ProcessOpened",
      "ProcessAdvanced",
      "ProcessRecurringObserved",
      "ProcessAdvanced",
      "ProcessSettling",
      "ProcessRecurringObserved",
    ],
  );
  assert.deepEqual(loop.getProcess("archive.glass-red"), {
    id: "archive.glass-red",
    progress: 2,
    settlesAt: 2,
    state: "settling",
  });
});

test("keeps recurring processes observable without blocking future ticks", () => {
  const loop = createDeterministicTickLoop({
    capabilities: enabledCapabilities,
    content: content(),
  });

  loop.advance(1);
  loop.advance(1, [commandStream()[0].command]);

  const recurringEvents = loop
    .getEvents()
    .filter((event) => event.type === "ProcessRecurringObserved");

  assert.equal(recurringEvents.length, 2);
  assert.equal(loop.snapshot().tick, 2);
  assert.equal(loop.getDiagnostics()?.tickCount, 2);
});

test("degrades lawfully when process core capability is disabled", () => {
  const loop = createDeterministicTickLoop({
    capabilities: disabledCapabilities,
    content: content(),
  });

  const events = loop.advance(1, [commandStream()[0].command]);

  assert.deepEqual(events, [
    {
      details: {
        commandId: "cmd.open-glass-red",
        commandType: "openProcess",
        reason: "capability-disabled:kernel.wasm.processCore",
      },
      sequence: 1,
      tick: 1,
      type: "CommandRejected",
    },
  ]);
  assert.deepEqual(loop.getProcess("archive.glass-red"), {
    id: "archive.glass-red",
    progress: 0,
    settlesAt: 2,
    state: "dormant",
  });
});

test("restores snapshots and rejects incompatible capability snapshots", () => {
  const original = replayDeterministicTicks({
    capabilities: enabledCapabilities,
    commandStream: commandStream(),
    content: content(),
    seed: "seed:fixed",
    ticks: 2,
  });

  const restored = restoreDeterministicTickLoop(original.snapshot, {
    capabilities: enabledCapabilities,
  });
  assert.deepEqual(restored.getEvents(), original.events);

  assert.throws(
    () =>
      restoreDeterministicTickLoop(original.snapshot, {
        capabilities: disabledCapabilities,
      }),
    /CAPABILITY_SNAPSHOT_MISMATCH/u,
  );
});

test("rejects unsafe command identifiers before they enter the queue", () => {
  const loop = createDeterministicTickLoop({
    capabilities: enabledCapabilities,
    content: content(),
  });

  assert.throws(
    () =>
      loop.enqueueCommand({
        id: "cmd.open-glass-red<script>",
        processId: "archive.glass-red",
        type: "openProcess",
      }),
    /command.id must be 1-128 safe identifier characters/u,
  );
  assert.deepEqual(loop.getEvents(), []);
});

test("sorts process snapshots using locale-independent id ordering", () => {
  const loop = createDeterministicTickLoop({
    capabilities: enabledCapabilities,
    content: {
      processes: [{ id: "alpha.route" }, { id: "Zeta.route" }],
    },
  });

  assert.deepEqual(
    loop.snapshot().processes.map((process) => process.id),
    ["Zeta.route", "alpha.route"],
  );
});

test("replays restored queued commands in target tick then received order", () => {
  const loop = createDeterministicTickLoop({
    capabilities: enabledCapabilities,
    content: {
      processes: [{ id: "archive.glass-red", state: "opened" }],
    },
    state: {
      eventLog: [],
      nextCommandOrder: 3,
      nextSequence: 1,
      processes: [{ id: "archive.glass-red", state: "opened" }],
      queuedCommands: [
        {
          command: {
            id: "cmd.set-recurring",
            processId: "archive.glass-red",
            state: "recurring",
            type: "setProcessState",
          },
          receivedOrder: 2,
          targetTick: 2,
        },
        {
          command: {
            id: "cmd.set-waiting",
            processId: "archive.glass-red",
            state: "waiting",
            type: "setProcessState",
          },
          receivedOrder: 1,
          targetTick: 1,
        },
      ],
      tick: 0,
    },
  });

  const events = loop.advance(2);

  assert.deepEqual(
    events
      .filter((event) => event.type === "ProcessStateSet")
      .map((event) => [
        event.tick,
        event.details.commandId,
        event.details.state,
      ]),
    [
      [1, "cmd.set-waiting", "waiting"],
      [2, "cmd.set-recurring", "recurring"],
    ],
  );
  assert.deepEqual(
    events
      .filter((event) => event.type === "ProcessRecurringObserved")
      .map((event) => event.tick),
    [2],
  );
  assert.equal(loop.getDiagnostics()?.queueDepth, 0);
});
