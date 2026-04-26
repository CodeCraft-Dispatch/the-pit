import test from "node:test";
import assert from "node:assert/strict";
import {
  createCommandDispatcher,
  createProcessCommandHandler,
} from "../../runtime/kernel/command-dispatcher.mjs";
import { createProcessStateContainer } from "../../runtime/kernel/process-state-container.mjs";

const enabledCapabilities = Object.freeze({
  values: {
    "kernel.module.commandDispatcher": true,
    "kernel.wasm.processCore": true,
  },
  provenance: {
    "kernel.module.commandDispatcher": { source: "build" },
    "kernel.wasm.processCore": { source: "build" },
  },
});

const dispatcherDisabledCapabilities = Object.freeze({
  values: {
    "kernel.module.commandDispatcher": false,
    "kernel.wasm.processCore": true,
  },
  provenance: {
    "kernel.module.commandDispatcher": { source: "build" },
    "kernel.wasm.processCore": { source: "build" },
  },
});

const processDisabledCapabilities = Object.freeze({
  values: {
    "kernel.module.commandDispatcher": true,
    "kernel.wasm.processCore": false,
  },
  provenance: {
    "kernel.module.commandDispatcher": { source: "build" },
    "kernel.wasm.processCore": { source: "build" },
  },
});

function createContainer() {
  return createProcessStateContainer([
    {
      id: "archive.glass-red",
      state: "dormant",
    },
  ]);
}

function openCommand(id = "cmd.open-glass-red") {
  return {
    id,
    processId: "archive.glass-red",
    type: "openProcess",
  };
}

test("dispatches process commands through the process command handler", () => {
  const processContainer = createContainer();
  const dispatcher = createCommandDispatcher({
    capabilities: enabledCapabilities,
    handlers: {
      process: createProcessCommandHandler(processContainer),
    },
  });

  assert.deepEqual(dispatcher.dispatchCommand(openCommand()), [
    {
      details: {
        commandId: "cmd.open-glass-red",
        processId: "archive.glass-red",
        state: "opened",
      },
      type: "ProcessOpened",
    },
  ]);
  assert.deepEqual(processContainer.getProcess("archive.glass-red"), {
    id: "archive.glass-red",
    progress: 0,
    settlesAt: null,
    state: "opened",
  });
});

test("dispatches ready queued commands by target tick then received order", () => {
  const processContainer = createContainer();
  const dispatcher = createCommandDispatcher({
    capabilities: enabledCapabilities,
    handlers: {
      process: createProcessCommandHandler(processContainer),
    },
    nextCommandOrder: 3,
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
  });

  assert.deepEqual(dispatcher.dispatchReadyCommands(1), [
    {
      details: {
        commandId: "cmd.set-waiting",
        processId: "archive.glass-red",
        state: "waiting",
      },
      type: "ProcessStateSet",
    },
  ]);
  assert.equal(dispatcher.getQueueDepth(), 1);

  assert.deepEqual(dispatcher.dispatchReadyCommands(2), [
    {
      details: {
        commandId: "cmd.set-recurring",
        processId: "archive.glass-red",
        state: "recurring",
      },
      type: "ProcessStateSet",
    },
  ]);
  assert.equal(dispatcher.getQueueDepth(), 0);
});

test("enqueues commands with deterministic target tick and order", () => {
  const dispatcher = createCommandDispatcher({
    capabilities: enabledCapabilities,
    handlers: {
      process: () => [],
    },
    nextCommandOrder: 7,
  });

  assert.deepEqual(
    dispatcher.enqueueCommand(openCommand("cmd.open-later"), {
      currentTick: 4,
      delayTicks: 3,
    }),
    openCommand("cmd.open-later"),
  );
  assert.equal(dispatcher.getNextCommandOrder(), 8);
  assert.deepEqual(dispatcher.snapshot(), [
    {
      command: openCommand("cmd.open-later"),
      receivedOrder: 7,
      targetTick: 7,
    },
  ]);
});

test("rejects process commands when the dispatcher capability is explicitly disabled", () => {
  const processContainer = createContainer();
  const dispatcher = createCommandDispatcher({
    capabilities: dispatcherDisabledCapabilities,
    handlers: {
      process: createProcessCommandHandler(processContainer),
    },
  });

  assert.deepEqual(dispatcher.dispatchCommand(openCommand()), [
    {
      details: {
        commandId: "cmd.open-glass-red",
        commandType: "openProcess",
        reason: "capability-disabled:kernel.module.commandDispatcher",
      },
      type: "CommandRejected",
    },
  ]);
  assert.deepEqual(processContainer.getProcess("archive.glass-red"), {
    id: "archive.glass-red",
    progress: 0,
    settlesAt: null,
    state: "dormant",
  });
});

test("rejects process commands when process core is disabled", () => {
  const processContainer = createContainer();
  const dispatcher = createCommandDispatcher({
    capabilities: processDisabledCapabilities,
    handlers: {
      process: createProcessCommandHandler(processContainer),
    },
  });

  assert.deepEqual(dispatcher.dispatchCommand(openCommand()), [
    {
      details: {
        commandId: "cmd.open-glass-red",
        commandType: "openProcess",
        reason: "capability-disabled:kernel.wasm.processCore",
      },
      type: "CommandRejected",
    },
  ]);
  assert.deepEqual(processContainer.getProcess("archive.glass-red"), {
    id: "archive.glass-red",
    progress: 0,
    settlesAt: null,
    state: "dormant",
  });
});

test("rejects unsafe command identifiers before commands enter the queue", () => {
  const dispatcher = createCommandDispatcher({
    capabilities: enabledCapabilities,
    handlers: {
      process: () => [],
    },
  });

  assert.throws(
    () =>
      dispatcher.enqueueCommand({
        id: "cmd.open<script>",
        processId: "archive.glass-red",
        type: "openProcess",
      }),
    /command.id must be 1-128 safe identifier characters/u,
  );
  assert.equal(dispatcher.getQueueDepth(), 0);
});
