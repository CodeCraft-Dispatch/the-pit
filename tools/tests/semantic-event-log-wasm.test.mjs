import test from "node:test";
import assert from "node:assert/strict";
import {
  createWasmSemanticEventLogCapabilityMask,
  createWasmSemanticEventLogCore,
} from "../../runtime/kernel/wasm/semantic-event-log-core.mjs";

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

const missingSemanticEventLogCapabilities = Object.freeze({
  values: {
    "kernel.wasm.processCore": true,
  },
  provenance: {
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

const processCoreDisabledCapabilities = Object.freeze({
  values: {
    "kernel.module.semanticEventLog": true,
    "kernel.wasm.processCore": false,
  },
  provenance: {
    "kernel.module.semanticEventLog": { source: "build" },
    "kernel.wasm.processCore": { source: "build" },
  },
});

test("derives the Wasm semantic event log capability mask from boot flags", () => {
  assert.equal(createWasmSemanticEventLogCapabilityMask(enabledCapabilities), 3);
  assert.equal(
    createWasmSemanticEventLogCapabilityMask(missingSemanticEventLogCapabilities),
    3,
  );
  assert.equal(createWasmSemanticEventLogCapabilityMask(disabledCapabilities), 1);
  assert.equal(
    createWasmSemanticEventLogCapabilityMask(processCoreDisabledCapabilities),
    2,
  );
});

test("boots the Wasm semantic event log core with immutable enabled capabilities", async () => {
  const core = await createWasmSemanticEventLogCore({
    capabilities: enabledCapabilities,
    eventCount: 7,
  });

  assert.equal(core.getCapabilityMask(), 3);
  assert.equal(core.getEventCount(), 7);
  assert.deepEqual(core.snapshot(), {
    capabilityMask: 3,
    eventCount: 7,
    module: "wasm.semantic-event-log-core",
    schemaVersion: 1,
  });
});

test("keeps the Wasm semantic event log inert when semantic logging is disabled", async () => {
  const core = await createWasmSemanticEventLogCore({
    capabilities: disabledCapabilities,
    eventCount: 7,
  });

  assert.equal(core.getCapabilityMask(), 1);
  assert.equal(core.getEventCount(), 0);
  assert.deepEqual(core.snapshot(), {
    capabilityMask: 1,
    eventCount: 0,
    module: "wasm.semantic-event-log-core",
    schemaVersion: 1,
  });
});

test("keeps the Wasm semantic event log inert when process core is disabled", async () => {
  const core = await createWasmSemanticEventLogCore({
    capabilities: processCoreDisabledCapabilities,
    eventCount: 7,
  });

  assert.equal(core.getCapabilityMask(), 2);
  assert.equal(core.getEventCount(), 0);
});

test("rejects invalid event counts before they cross the Wasm boundary", async () => {
  await assert.rejects(
    () =>
      createWasmSemanticEventLogCore({
        capabilities: enabledCapabilities,
        eventCount: -1,
      }),
    /eventCount must be an integer from 0 to 2147483647/u,
  );
});
