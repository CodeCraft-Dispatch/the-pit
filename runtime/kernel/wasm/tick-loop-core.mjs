const PROCESS_CORE_FLAG = "kernel.wasm.processCore";
const PROCESS_CORE_BIT = 1;
const SNAPSHOT_SCHEMA_VERSION = 1;
const MAX_I32_TICK_DELTA = 2_147_483_647;

// Minimal WebAssembly module for the first kernel ABI slice.
//
// Exports:
// - boot(i32 capabilityMask) -> void
// - tick(i32 count) -> i32
// - get_tick() -> i32
// - get_capabilities() -> i32
//
// This is intentionally tiny and compiler-free. It proves that the host can boot
// a Wasm kernel with an immutable capability mask and advance a deterministic
// fixed tick without introducing a Rust, AssemblyScript, or bundler dependency
// before the ABI stabilizes.
const WASM_TICK_CORE_BYTES = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x0e, 0x03, 0x60,
  0x01, 0x7f, 0x00, 0x60, 0x01, 0x7f, 0x01, 0x7f, 0x60, 0x00, 0x01, 0x7f,
  0x03, 0x05, 0x04, 0x00, 0x01, 0x02, 0x02, 0x06, 0x0b, 0x02, 0x7f, 0x01,
  0x41, 0x00, 0x0b, 0x7f, 0x01, 0x41, 0x00, 0x0b, 0x07, 0x2d, 0x04, 0x04,
  0x62, 0x6f, 0x6f, 0x74, 0x00, 0x00, 0x04, 0x74, 0x69, 0x63, 0x6b, 0x00,
  0x01, 0x08, 0x67, 0x65, 0x74, 0x5f, 0x74, 0x69, 0x63, 0x6b, 0x00, 0x02,
  0x10, 0x67, 0x65, 0x74, 0x5f, 0x63, 0x61, 0x70, 0x61, 0x62, 0x69, 0x6c,
  0x69, 0x74, 0x69, 0x65, 0x73, 0x00, 0x03, 0x0a, 0x2e, 0x04, 0x0a, 0x00,
  0x20, 0x00, 0x24, 0x01, 0x41, 0x00, 0x24, 0x00, 0x0b, 0x17, 0x00, 0x23,
  0x01, 0x41, 0x01, 0x71, 0x45, 0x04, 0x7f, 0x41, 0x7f, 0x05, 0x23, 0x00,
  0x20, 0x00, 0x6a, 0x24, 0x00, 0x23, 0x00, 0x0b, 0x0b, 0x04, 0x00, 0x23,
  0x00, 0x0b, 0x04, 0x00, 0x23, 0x01, 0x0b,
]);

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function validateTickDelta(value) {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_I32_TICK_DELTA
  ) {
    throw new RangeError(
      `tickCount must be an integer from 0 to ${MAX_I32_TICK_DELTA}`,
    );
  }
}

export function createWasmCapabilityMask(capabilities = {}) {
  assertPlainObject(capabilities, "capabilities");
  const values = capabilities.values ?? {};
  assertPlainObject(values, "capabilities.values");

  return values[PROCESS_CORE_FLAG] === true ? PROCESS_CORE_BIT : 0;
}

function requireExport(instance, name) {
  const exported = instance.exports[name];
  if (typeof exported !== "function") {
    throw new Error(`WASM_EXPORT_MISSING:${name}`);
  }
  return exported;
}

export async function createWasmTickLoopCore(options = {}) {
  assertPlainObject(options, "options");

  if (typeof WebAssembly === "undefined") {
    throw new Error("WEBASSEMBLY_UNAVAILABLE");
  }

  const capabilityMask = createWasmCapabilityMask(options.capabilities ?? {});
  const { instance } = await WebAssembly.instantiate(WASM_TICK_CORE_BYTES, {});
  const boot = requireExport(instance, "boot");
  const tick = requireExport(instance, "tick");
  const getTick = requireExport(instance, "get_tick");
  const getCapabilities = requireExport(instance, "get_capabilities");

  boot(capabilityMask);

  function advance(tickCount = 1) {
    validateTickDelta(tickCount);
    const result = tick(tickCount);

    if (result === -1) {
      return {
        accepted: false,
        reason: "capability-disabled:kernel.wasm.processCore",
        tick: getTick(),
      };
    }

    return {
      accepted: true,
      tick: result,
    };
  }

  function snapshot() {
    return {
      capabilityMask: getCapabilities(),
      module: "wasm.tick-loop-core",
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      tick: getTick(),
    };
  }

  return Object.freeze({
    advance,
    getCapabilityMask: getCapabilities,
    getTick,
    snapshot,
  });
}
