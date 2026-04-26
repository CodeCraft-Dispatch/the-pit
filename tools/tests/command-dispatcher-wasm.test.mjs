import test from "node:test";
import assert from "node:assert/strict";
import {
  createWasmCommandDispatcherCapabilityMask,
  createWasmCommandDispatcherCore,
} from "../../runtime/kernel/wasm/command-dispatcher-core.mjs";

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

test("derives the Wasm command-dispatcher capability mask from boot flags", () => {
  assert.equal(
    createWasmCommandDispatcherCapabilityMask(enabledCapabilities),
    3,
  );
  assert.equal(
    createWasmCommandDispatcherCapabilityMask(dispatcherDisabledCapabilities),
    1,
  );
  assert.equal(
    createWasmCommandDispatcherCapabilityMask(processDisabledCapabilities),
    2,
  );
});

test("boots the Wasm command dispatcher with immutable enabled capabilities", async () => {
  const core = await createWasmCommandDispatcherCore({
    capabilities: enabledCapabilities,
    queueDepth: 2,
  });

  assert.equal(core.getCapabilityMask(), 3);
  assert.equal(core.getQueueDepth(), 2);
  assert.deepEqual(core.snapshot(), {
    capabilityMask: 3,
    module: "wasm.command-dispatcher-core",
    queueDepth: 2,
    schemaVersion: 1,
  });
});

test("keeps the Wasm command dispatcher inert when dispatcher capability is disabled", async () => {
  const core = await createWasmCommandDispatcherCore({
    capabilities: dispatcherDisabledCapabilities,
    queueDepth: 2,
  });

  assert.equal(core.getCapabilityMask(), 1);
  assert.equal(core.getQueueDepth(), 0);
  assert.deepEqual(core.snapshot(), {
    capabilityMask: 1,
    module: "wasm.command-dispatcher-core",
    queueDepth: 0,
    schemaVersion: 1,
  });
});

test("keeps the Wasm command dispatcher inert when process core is disabled", async () => {
  const core = await createWasmCommandDispatcherCore({
    capabilities: processDisabledCapabilities,
    queueDepth: 2,
  });

  assert.equal(core.getCapabilityMask(), 2);
  assert.equal(core.getQueueDepth(), 0);
  assert.deepEqual(core.snapshot(), {
    capabilityMask: 2,
    module: "wasm.command-dispatcher-core",
    queueDepth: 0,
    schemaVersion: 1,
  });
});

test("rejects invalid queue depths before they cross the Wasm boundary", async () => {
  await assert.rejects(
    () =>
      createWasmCommandDispatcherCore({
        capabilities: enabledCapabilities,
        queueDepth: -1,
      }),
    /queueDepth must be an integer from 0 to 2147483647/u,
  );
});
