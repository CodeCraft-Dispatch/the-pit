export interface WasmCommandDispatcherCapabilities {
  values: Record<string, boolean>;
  provenance?: Record<string, unknown>;
}

export interface WasmCommandDispatcherOptions {
  capabilities?: WasmCommandDispatcherCapabilities;
  queueDepth?: number;
}

export interface WasmCommandDispatcherSnapshot {
  capabilityMask: number;
  module: "wasm.command-dispatcher-core";
  queueDepth: number;
  schemaVersion: number;
}

export interface WasmCommandDispatcherCore {
  getCapabilityMask(): number;
  getQueueDepth(): number;
  snapshot(): WasmCommandDispatcherSnapshot;
}

export function createWasmCommandDispatcherCapabilityMask(
  capabilities?: WasmCommandDispatcherCapabilities,
): number;

export function createWasmCommandDispatcherCore(
  options?: WasmCommandDispatcherOptions,
): Promise<WasmCommandDispatcherCore>;
