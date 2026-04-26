import type {
  KernelCapabilitySnapshot,
  KernelSemanticEvent,
} from "../kernel/semantic-event-log.d.ts";

export interface ProjectionJournalEntry {
  id: string;
  sequence: number;
  tick: number;
  eventType: string;
  processId: string | null;
  commandId: string | null;
  summary: string;
  details: Record<string, unknown>;
}

export interface ProjectionMapNode {
  id: string;
  kind: "process" | "command";
  eventTypes: string[];
  firstSequence: number;
  lastSequence: number;
  lastTick: number;
}

export interface ProjectionMapEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  firstSequence: number;
  lastSequence: number;
  lastTick: number;
}

export interface ProjectionSemanticMap {
  nodes: ProjectionMapNode[];
  edges: ProjectionMapEdge[];
}

export interface JournalMapProjectionSnapshot {
  enabled: boolean;
  journalEntries: ProjectionJournalEntry[];
  lastSequence: number;
  schemaVersion: number;
  semanticMap: ProjectionSemanticMap;
}

export interface JournalMapProjectionOptions {
  capabilities?: KernelCapabilitySnapshot;
  state?: Partial<JournalMapProjectionSnapshot>;
  events?: KernelSemanticEvent[];
}

export interface JournalMapProjectionShell {
  projectEvents(events: KernelSemanticEvent[]): {
    journalEntries: ProjectionJournalEntry[];
    semanticMap: ProjectionSemanticMap;
  };
  getDiagnostics(): Record<string, unknown>;
  getJournalEntries(): ProjectionJournalEntry[];
  getSemanticMap(): ProjectionSemanticMap;
  snapshot(): JournalMapProjectionSnapshot;
}

export const JOURNAL_MAP_PROJECTION_FLAG: "engine.projection.journalMap";
export const JOURNAL_MAP_PROJECTION_SCHEMA_VERSION: 1;

export function createJournalMapProjectionShell(
  options?: JournalMapProjectionOptions,
): JournalMapProjectionShell;
