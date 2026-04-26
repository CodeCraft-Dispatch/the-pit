export interface WasmSemanticEventLogCapabilities {
  values: Record<string, boolean>;
  provenance?: Record<string, unknown>;
}

export interface WasmSemanticEventLogCoreOptions {
  capabilities?: WasmSemanticEventLogCapabilities;
  eventCount?: number;
}

export interface WasmSemanticEventLogCoreSnapshot {
  capabilityMask: number;
  eventCount: number;
  module: "wasm.semantic-event-log-core";
  schemaVersion: number;
}

export interface WasmSemanticEventLogCore {
  getCapabilityMask(): number;
  getEventCount(): number;
  snapshot(): WasmSemanticEventLogCoreSnapshot;
}

export function createWasmSemanticEventLogCapabilityMask(
  capabilities?: WasmSemanticEventLogCapabilities,
): number;

export function createWasmSemanticEventLogCore(
  options?: WasmSemanticEventLogCoreOptions,
): Promise<WasmSemanticEventLogCore>;
