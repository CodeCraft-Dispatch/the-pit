export interface WasmProcessStateContainerCapabilities {
  values: Record<string, boolean>;
  provenance?: Record<string, unknown>;
}

export interface WasmProcessStateContainerOptions {
  capabilities?: WasmProcessStateContainerCapabilities;
  processCount?: number;
}

export interface WasmProcessStateContainerSnapshot {
  capabilityMask: number;
  module: "wasm.process-state-container-core";
  processCount: number;
  schemaVersion: number;
}

export interface WasmProcessStateContainerCore {
  getCapabilityMask(): number;
  getProcessCount(): number;
  snapshot(): WasmProcessStateContainerSnapshot;
}

export function createWasmProcessStateCapabilityMask(
  capabilities?: WasmProcessStateContainerCapabilities,
): number;

export function createWasmProcessStateContainerCore(
  options?: WasmProcessStateContainerOptions,
): Promise<WasmProcessStateContainerCore>;
