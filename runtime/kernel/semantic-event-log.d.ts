export interface KernelCapabilitySnapshot {
  values: Record<string, boolean>;
  provenance?: Record<string, unknown>;
}

export interface KernelEventDraft {
  type: string;
  details?: Record<string, unknown>;
}

export interface KernelSemanticEvent extends KernelEventDraft {
  sequence: number;
  tick: number;
  details: Record<string, unknown>;
}

export interface KernelSemanticEventLogSnapshot {
  enabled: boolean;
  events: KernelSemanticEvent[];
  nextSequence: number;
  schemaVersion: number;
}

export interface SemanticEventLogOptions {
  capabilities?: KernelCapabilitySnapshot;
  state?: Partial<KernelSemanticEventLogSnapshot> & {
    eventLog?: KernelSemanticEvent[];
  };
}

export interface SemanticEventLog {
  appendEvent(
    event: KernelEventDraft,
    options?: { tick?: number },
  ): KernelSemanticEvent | null;
  findEventsByType(type: string): KernelSemanticEvent[];
  getDiagnostics(): Record<string, unknown>;
  getEventCount(): number;
  getEvents(): KernelSemanticEvent[];
  getNextSequence(): number;
  snapshot(): KernelSemanticEventLogSnapshot;
}

export const SEMANTIC_EVENT_LOG_FLAG: "kernel.module.semanticEventLog";
export const SEMANTIC_EVENT_LOG_SCHEMA_VERSION: 1;

export function normalizeSemanticEventDraft(
  event: KernelEventDraft,
): Required<KernelEventDraft>;

export function cloneSemanticEvent(
  event: KernelSemanticEvent,
): KernelSemanticEvent;

export function createSemanticEventLog(
  options?: SemanticEventLogOptions,
): SemanticEventLog;
