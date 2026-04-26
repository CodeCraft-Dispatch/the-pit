const PROCESS_CORE_FLAG = "kernel.wasm.processCore";
const COMMAND_DISPATCHER_FLAG = "kernel.module.commandDispatcher";
const PROCESS_CORE_BIT = 1;
const COMMAND_DISPATCHER_BIT = 2;
const SNAPSHOT_SCHEMA_VERSION = 1;
const MAX_I32_QUEUE_DEPTH = 2_147_483_647;

// Minimal WebAssembly module for the command-dispatcher ABI slice.
//
// Exports:
// - boot(i32 capabilityMask, i32 queueDepth) -> void
// - get_queue_depth() -> i32
// - get_capabilities() -> i32
//
// This mirrors the process-state container's staged Wasm strategy. The semantic
// dispatcher remains in the zero-cost `.mjs` reference model while this tiny
// compiler-free Wasm boundary proves immutable boot capabilities and queue-shape
// metadata before command routing moves into compiled kernel memory.
const WASM_COMMAND_DISPATCHER_BYTES = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x0a, 0x02, 0x60, 0x02,
  0x7f, 0x7f, 0x00, 0x60, 0x00, 0x01, 0x7f, 0x03, 0x04, 0x03, 0x00, 0x01, 0x01,
  0x06, 0x0b, 0x02, 0x7f, 0x01, 0x41, 0x00, 0x0b, 0x7f, 0x01, 0x41, 0x00, 0x0b,
  0x07, 0x2d, 0x03, 0x04, 0x62, 0x6f, 0x6f, 0x74, 0x00, 0x00, 0x0f, 0x67, 0x65,
  0x74, 0x5f, 0x71, 0x75, 0x65, 0x75, 0x65, 0x5f, 0x64, 0x65, 0x70, 0x74, 0x68,
  0x00, 0x01, 0x10, 0x67, 0x65, 0x74, 0x5f, 0x63, 0x61, 0x70, 0x61, 0x62, 0x69,
  0x6c, 0x69, 0x74, 0x69, 0x65, 0x73, 0x00, 0x02, 0x0a, 0x16, 0x03, 0x0a, 0x00,
  0x20, 0x00, 0x24, 0x01, 0x20, 0x01, 0x24, 0x00, 0x0b, 0x04, 0x00, 0x23, 0x00,
  0x0b, 0x04, 0x00, 0x23, 0x01, 0x0b,
]);

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function validateQueueDepth(value) {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_I32_QUEUE_DEPTH
  ) {
    throw new RangeError(
      `queueDepth must be an integer from 0 to ${MAX_I32_QUEUE_DEPTH}`,
    );
  }
}

export function createWasmCommandDispatcherCapabilityMask(capabilities = {}) {
  assertPlainObject(capabilities, "capabilities");
  const values = capabilities.values ?? {};
  assertPlainObject(values, "capabilities.values");

  let mask = 0;
  if (values[PROCESS_CORE_FLAG] === true) {
    mask |= PROCESS_CORE_BIT;
  }
  if (values[COMMAND_DISPATCHER_FLAG] === true) {
    mask |= COMMAND_DISPATCHER_BIT;
  }

  return mask;
}

function requireExport(instance, name) {
  const exported = instance.exports[name];
  if (typeof exported !== "function") {
    throw new Error(`WASM_EXPORT_MISSING:${name}`);
  }
  return exported;
}

function isDispatcherEnabled(capabilityMask) {
  return (
    (capabilityMask & PROCESS_CORE_BIT) === PROCESS_CORE_BIT &&
    (capabilityMask & COMMAND_DISPATCHER_BIT) === COMMAND_DISPATCHER_BIT
  );
}

export async function createWasmCommandDispatcherCore(options = {}) {
  assertPlainObject(options, "options");

  if (typeof WebAssembly === "undefined") {
    throw new Error("WEBASSEMBLY_UNAVAILABLE");
  }

  const queueDepth = options.queueDepth ?? 0;
  validateQueueDepth(queueDepth);

  const capabilityMask = createWasmCommandDispatcherCapabilityMask(
    options.capabilities ?? {},
  );
  const { instance } = await WebAssembly.instantiate(
    WASM_COMMAND_DISPATCHER_BYTES,
    {},
  );
  const boot = requireExport(instance, "boot");
  const getQueueDepth = requireExport(instance, "get_queue_depth");
  const getCapabilities = requireExport(instance, "get_capabilities");

  boot(capabilityMask, isDispatcherEnabled(capabilityMask) ? queueDepth : 0);

  function snapshot() {
    return {
      capabilityMask: getCapabilities(),
      module: "wasm.command-dispatcher-core",
      queueDepth: getQueueDepth(),
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    };
  }

  return Object.freeze({
    getCapabilityMask: getCapabilities,
    getQueueDepth,
    snapshot,
  });
}
