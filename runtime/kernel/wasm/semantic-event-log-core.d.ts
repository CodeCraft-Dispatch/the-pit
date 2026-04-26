import type { KernelCapabilitySnapshot } from "../semantic-event-log";

export interface WasmSemanticEventLogCoreOptions {
  capabilities?: KernelCapabilitySnapshot;
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
  capabilities?: KernelCapabilitySnapshot,
): number;

export function createWasmSemanticEventLogCore(
  options?: WasmSemanticEventLogCoreOptions,
): Promise<WasmSemanticEventLogCore>;
