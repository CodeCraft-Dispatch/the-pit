import test from "node:test";
import assert from "node:assert/strict";
import { replayDeterministicTicks } from "../../runtime/kernel/deterministic-tick-loop.mjs";
import {
  createWasmCapabilityMask,
  createWasmTickLoopCore,
} from "../../runtime/kernel/wasm/tick-loop-core.mjs";

const enabledCapabilities = Object.freeze({
  values: {
    "kernel.wasm.processCore": true,
  },
  provenance: {
    "kernel.wasm.processCore": { source: "build" },
  },
});

const disabledCapabilities = Object.freeze({
  values: {
    "kernel.wasm.processCore": false,
  },
  provenance: {
    "kernel.wasm.processCore": { source: "build" },
  },
});

test("derives a narrow wasm capability mask from the boot snapshot", () => {
  assert.equal(createWasmCapabilityMask(enabledCapabilities), 1);
  assert.equal(createWasmCapabilityMask(disabledCapabilities), 0);
});

test("boots wasm with immutable capabilities and advances fixed ticks", async () => {
  const core = await createWasmTickLoopCore({
    capabilities: enabledCapabilities,
  });

  assert.equal(core.getCapabilityMask(), 1);
  assert.deepEqual(core.advance(2), {
    accepted: true,
    tick: 2,
  });
  assert.deepEqual(core.advance(1), {
    accepted: true,
    tick: 3,
  });
  assert.deepEqual(core.snapshot(), {
    capabilityMask: 1,
    module: "wasm.tick-loop-core",
    schemaVersion: 1,
    tick: 3,
  });
});

test("degrades lawfully when process core is disabled", async () => {
  const core = await createWasmTickLoopCore({
    capabilities: disabledCapabilities,
  });

  assert.equal(core.getCapabilityMask(), 0);
  assert.deepEqual(core.advance(1), {
    accepted: false,
    reason: "capability-disabled:kernel.wasm.processCore",
    tick: 0,
  });
  assert.equal(core.getTick(), 0);
});

test("rejects invalid tick deltas before they cross the wasm boundary", async () => {
  const core = await createWasmTickLoopCore({
    capabilities: enabledCapabilities,
  });

  assert.throws(() => core.advance(-1), /tickCount must be an integer/u);
  assert.throws(() => core.advance(2.5), /tickCount must be an integer/u);
  assert.equal(core.getTick(), 0);
});

test("rejects tick deltas that would overflow the i32 tick counter", async () => {
  const core = await createWasmTickLoopCore({
    capabilities: enabledCapabilities,
  });

  assert.deepEqual(core.advance(2_147_483_646), {
    accepted: true,
    tick: 2_147_483_646,
  });

  assert.throws(
    () => core.advance(2),
    /tickCount would overflow i32 tick counter/u,
  );
  assert.equal(core.getTick(), 2_147_483_646);
});

test("matches the reference tick count for an enabled fixed-step run", async () => {
  const wasmCore = await createWasmTickLoopCore({
    capabilities: enabledCapabilities,
  });
  wasmCore.advance(3);

  const reference = replayDeterministicTicks({
    capabilities: enabledCapabilities,
    content: {
      processes: [
        {
          id: "archive.glass-red",
          state: "dormant",
        },
      ],
    },
    ticks: 3,
  });

  assert.equal(wasmCore.getTick(), reference.snapshot.tick);
});
