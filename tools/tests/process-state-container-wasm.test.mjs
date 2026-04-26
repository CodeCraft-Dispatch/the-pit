import test from "node:test";
import assert from "node:assert/strict";
import {
  createWasmProcessStateCapabilityMask,
  createWasmProcessStateContainerCore,
} from "../../runtime/kernel/wasm/process-state-container-core.mjs";

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

test("derives the Wasm process-state capability mask from the process core flag", () => {
  assert.equal(createWasmProcessStateCapabilityMask(enabledCapabilities), 1);
  assert.equal(createWasmProcessStateCapabilityMask(disabledCapabilities), 0);
});

test("boots the Wasm process state container with immutable enabled capabilities", async () => {
  const core = await createWasmProcessStateContainerCore({
    capabilities: enabledCapabilities,
    processCount: 2,
  });

  assert.equal(core.getCapabilityMask(), 1);
  assert.equal(core.getProcessCount(), 2);
  assert.deepEqual(core.snapshot(), {
    capabilityMask: 1,
    module: "wasm.process-state-container-core",
    processCount: 2,
    schemaVersion: 1,
  });
});

test("keeps the Wasm process state container inert when process core is disabled", async () => {
  const core = await createWasmProcessStateContainerCore({
    capabilities: disabledCapabilities,
    processCount: 2,
  });

  assert.equal(core.getCapabilityMask(), 0);
  assert.equal(core.getProcessCount(), 0);
  assert.deepEqual(core.snapshot(), {
    capabilityMask: 0,
    module: "wasm.process-state-container-core",
    processCount: 0,
    schemaVersion: 1,
  });
});

test("rejects invalid process counts before they cross the Wasm boundary", async () => {
  await assert.rejects(
    () =>
      createWasmProcessStateContainerCore({
        capabilities: enabledCapabilities,
        processCount: -1,
      }),
    /processCount must be an integer from 0 to 2147483647/u,
  );
});
