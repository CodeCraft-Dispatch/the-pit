const PROCESS_CORE_FLAG = "kernel.wasm.processCore";
const PROCESS_CORE_BIT = 1;
const SNAPSHOT_SCHEMA_VERSION = 1;
const MAX_I32_PROCESS_COUNT = 2_147_483_647;

// Minimal WebAssembly module for the process-state-container ABI slice.
//
// Exports:
// - boot(i32 capabilityMask, i32 processCount) -> void
// - get_process_count() -> i32
// - get_capabilities() -> i32
//
// This intentionally mirrors the deterministic tick loop's staged Wasm
// strategy: a compiler-free Wasm boundary proves immutable boot capabilities
// and process-container shape without moving semantic process mutation into raw
// Wasm memory before the reference model stabilizes.
const WASM_PROCESS_STATE_CONTAINER_BYTES = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x0d, 0x02, 0x60, 0x02,
  0x7f, 0x7f, 0x00, 0x60, 0x00, 0x01, 0x7f, 0x03, 0x04, 0x03, 0x00, 0x01, 0x01,
  0x06, 0x0b, 0x02, 0x7f, 0x01, 0x41, 0x00, 0x0b, 0x7f, 0x01, 0x41, 0x00, 0x0b,
  0x07, 0x3d, 0x03, 0x04, 0x62, 0x6f, 0x6f, 0x74, 0x00, 0x00, 0x11, 0x67, 0x65,
  0x74, 0x5f, 0x70, 0x72, 0x6f, 0x63, 0x65, 0x73, 0x73, 0x5f, 0x63, 0x6f, 0x75,
  0x6e, 0x74, 0x00, 0x01, 0x10, 0x67, 0x65, 0x74, 0x5f, 0x63, 0x61, 0x70, 0x61,
  0x62, 0x69, 0x6c, 0x69, 0x74, 0x69, 0x65, 0x73, 0x00, 0x02, 0x0a, 0x17, 0x03,
  0x0d, 0x00, 0x20, 0x00, 0x24, 0x01, 0x20, 0x01, 0x24, 0x00, 0x0b, 0x04, 0x00,
  0x23, 0x00, 0x0b, 0x04, 0x00, 0x23, 0x01, 0x0b,
]);

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function validateProcessCount(value) {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_I32_PROCESS_COUNT
  ) {
    throw new RangeError(
      `processCount must be an integer from 0 to ${MAX_I32_PROCESS_COUNT}`,
    );
  }
}

export function createWasmProcessStateCapabilityMask(capabilities = {}) {
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

export async function createWasmProcessStateContainerCore(options = {}) {
  assertPlainObject(options, "options");

  if (typeof WebAssembly === "undefined") {
    throw new Error("WEBASSEMBLY_UNAVAILABLE");
  }

  const processCount = options.processCount ?? 0;
  validateProcessCount(processCount);

  const capabilityMask = createWasmProcessStateCapabilityMask(
    options.capabilities ?? {},
  );
  const { instance } = await WebAssembly.instantiate(
    WASM_PROCESS_STATE_CONTAINER_BYTES,
    {},
  );
  const boot = requireExport(instance, "boot");
  const getProcessCount = requireExport(instance, "get_process_count");
  const getCapabilities = requireExport(instance, "get_capabilities");

  boot(capabilityMask, capabilityMask === PROCESS_CORE_BIT ? processCount : 0);

  function snapshot() {
    return {
      capabilityMask: getCapabilities(),
      module: "wasm.process-state-container-core",
      processCount: getProcessCount(),
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    };
  }

  return Object.freeze({
    getCapabilityMask: getCapabilities,
    getProcessCount,
    snapshot,
  });
}
