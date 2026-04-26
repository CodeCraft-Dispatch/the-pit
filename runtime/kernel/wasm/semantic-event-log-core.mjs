const PROCESS_CORE_FLAG = "kernel.wasm.processCore";
const SEMANTIC_EVENT_LOG_FLAG = "kernel.module.semanticEventLog";
const PROCESS_CORE_BIT = 1;
const SEMANTIC_EVENT_LOG_BIT = 2;
const SNAPSHOT_SCHEMA_VERSION = 1;
const MAX_I32_EVENT_COUNT = 2_147_483_647;

// Minimal WebAssembly module for the semantic-event-log ABI slice.
//
// Exports:
// - boot(i32 capabilityMask, i32 eventCount) -> void
// - get_event_count() -> i32
// - get_capabilities() -> i32
//
// This intentionally mirrors the process-state-container staged Wasm strategy:
// prove immutable boot capabilities and event-log metadata without moving
// semantic event storage into raw Wasm memory before the reference model is
// stable.
const WASM_SEMANTIC_EVENT_LOG_BYTES = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x0a, 0x02, 0x60, 0x02,
  0x7f, 0x7f, 0x00, 0x60, 0x00, 0x01, 0x7f, 0x03, 0x04, 0x03, 0x00, 0x01, 0x01,
  0x06, 0x0b, 0x02, 0x7f, 0x01, 0x41, 0x00, 0x0b, 0x7f, 0x01, 0x41, 0x00, 0x0b,
  0x07, 0x2d, 0x03, 0x04, 0x62, 0x6f, 0x6f, 0x74, 0x00, 0x00, 0x0f, 0x67, 0x65,
  0x74, 0x5f, 0x65, 0x76, 0x65, 0x6e, 0x74, 0x5f, 0x63, 0x6f, 0x75, 0x6e, 0x74,
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

function validateEventCount(value) {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_I32_EVENT_COUNT
  ) {
    throw new RangeError(
      `eventCount must be an integer from 0 to ${MAX_I32_EVENT_COUNT}`,
    );
  }
}

export function createWasmSemanticEventLogCapabilityMask(capabilities = {}) {
  assertPlainObject(capabilities, "capabilities");
  const values = capabilities.values ?? {};
  assertPlainObject(values, "capabilities.values");

  let mask = 0;
  if (values[PROCESS_CORE_FLAG] === true) {
    mask |= PROCESS_CORE_BIT;
  }
  if (values[SEMANTIC_EVENT_LOG_FLAG] !== false) {
    mask |= SEMANTIC_EVENT_LOG_BIT;
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

export async function createWasmSemanticEventLogCore(options = {}) {
  assertPlainObject(options, "options");

  if (typeof WebAssembly === "undefined") {
    throw new Error("WEBASSEMBLY_UNAVAILABLE");
  }

  const eventCount = options.eventCount ?? 0;
  validateEventCount(eventCount);

  const capabilityMask = createWasmSemanticEventLogCapabilityMask(
    options.capabilities ?? {},
  );
  const isEnabled =
    (capabilityMask & PROCESS_CORE_BIT) !== 0 &&
    (capabilityMask & SEMANTIC_EVENT_LOG_BIT) !== 0;

  const { instance } = await WebAssembly.instantiate(
    WASM_SEMANTIC_EVENT_LOG_BYTES,
    {},
  );
  const boot = requireExport(instance, "boot");
  const getEventCount = requireExport(instance, "get_event_count");
  const getCapabilities = requireExport(instance, "get_capabilities");

  boot(capabilityMask, isEnabled ? eventCount : 0);

  function snapshot() {
    return {
      capabilityMask: getCapabilities(),
      eventCount: getEventCount(),
      module: "wasm.semantic-event-log-core",
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    };
  }

  return Object.freeze({
    getCapabilityMask: getCapabilities,
    getEventCount,
    snapshot,
  });
}
