import test from "node:test";
import assert from "node:assert/strict";
import { createProcessStateContainer } from "../../runtime/kernel/process-state-container.mjs";

function createContainer() {
  return createProcessStateContainer([
    {
      id: "archive.glass-red",
      settlesAt: 2,
      state: "dormant",
    },
    {
      id: "route.north-gallery",
      state: "recurring",
    },
  ]);
}

test("normalizes process records and snapshots them in stable id order", () => {
  const container = createProcessStateContainer([
    { id: "alpha.route" },
    { id: "Zeta.route", progress: 3, state: "waiting" },
  ]);

  assert.deepEqual(container.snapshot(), [
    {
      id: "Zeta.route",
      progress: 3,
      settlesAt: null,
      state: "waiting",
    },
    {
      id: "alpha.route",
      progress: 0,
      settlesAt: null,
      state: "dormant",
    },
  ]);
});

test("opens dormant and occluded processes through command envelopes", () => {
  const container = createProcessStateContainer([
    { id: "archive.glass-red", state: "dormant" },
    { id: "archive.hidden", state: "occluded" },
  ]);

  assert.deepEqual(
    container.applyCommand({
      id: "cmd.open-glass-red",
      processId: "archive.glass-red",
      type: "openProcess",
    }),
    [
      {
        details: {
          commandId: "cmd.open-glass-red",
          processId: "archive.glass-red",
          state: "opened",
        },
        type: "ProcessOpened",
      },
    ],
  );
  assert.deepEqual(
    container.applyCommand({
      id: "cmd.open-hidden",
      processId: "archive.hidden",
      type: "openProcess",
    }),
    [
      {
        details: {
          commandId: "cmd.open-hidden",
          processId: "archive.hidden",
          state: "opened",
        },
        type: "ProcessOpened",
      },
    ],
  );
});

test("ignores open commands for already active processes without mutation", () => {
  const container = createProcessStateContainer([
    { id: "archive.glass-red", progress: 4, state: "advancing" },
  ]);

  assert.deepEqual(
    container.applyCommand({
      id: "cmd.open-again",
      processId: "archive.glass-red",
      type: "openProcess",
    }),
    [
      {
        details: {
          commandId: "cmd.open-again",
          processId: "archive.glass-red",
          state: "advancing",
        },
        type: "ProcessOpenIgnored",
      },
    ],
  );
  assert.deepEqual(container.getProcess("archive.glass-red"), {
    id: "archive.glass-red",
    progress: 4,
    settlesAt: null,
    state: "advancing",
  });
});

test("sets valid process states and reports unknown process rejections", () => {
  const container = createContainer();

  assert.deepEqual(
    container.applyCommand({
      id: "cmd.wait",
      processId: "archive.glass-red",
      state: "waiting",
      type: "setProcessState",
    }),
    [
      {
        details: {
          commandId: "cmd.wait",
          processId: "archive.glass-red",
          state: "waiting",
        },
        type: "ProcessStateSet",
      },
    ],
  );
  assert.deepEqual(
    container.applyCommand({
      id: "cmd.unknown",
      processId: "archive.missing",
      type: "openProcess",
    }),
    [
      {
        details: {
          commandId: "cmd.unknown",
          commandType: "openProcess",
          reason: "unknown-process",
        },
        type: "CommandRejected",
      },
    ],
  );
});

test("advances opened processes and emits settling when thresholds are reached", () => {
  const container = createContainer();

  container.applyCommand({
    id: "cmd.open-glass-red",
    processId: "archive.glass-red",
    type: "openProcess",
  });

  assert.deepEqual(container.advanceProcesses(), [
    {
      details: {
        processId: "archive.glass-red",
        progress: 1,
        state: "advancing",
      },
      type: "ProcessAdvanced",
    },
    {
      details: {
        processId: "route.north-gallery",
        progress: 0,
        state: "recurring",
      },
      type: "ProcessRecurringObserved",
    },
  ]);

  assert.deepEqual(container.advanceProcesses(), [
    {
      details: {
        processId: "archive.glass-red",
        progress: 2,
        state: "advancing",
      },
      type: "ProcessAdvanced",
    },
    {
      details: {
        processId: "archive.glass-red",
        progress: 2,
        state: "settling",
      },
      type: "ProcessSettling",
    },
    {
      details: {
        processId: "route.north-gallery",
        progress: 0,
        state: "recurring",
      },
      type: "ProcessRecurringObserved",
    },
  ]);
});

test("rejects duplicate and unsafe process definitions before container creation", () => {
  assert.throws(
    () => createProcessStateContainer([{ id: "archive.one" }, { id: "archive.one" }]),
    /duplicate process id archive.one/u,
  );

  assert.throws(
    () => createProcessStateContainer([{ id: "archive<script>" }]),
    /process.id must be 1-128 safe identifier characters/u,
  );
});
