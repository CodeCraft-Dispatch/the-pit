import type { KernelCapabilitySnapshot } from "../kernel/semantic-event-log.d.ts";

export interface ContentLoaderFlags {
  requires: string[];
}

export interface ContentLoaderView {
  text: string;
}

export interface ContentLoaderCommand {
  costs: Record<string, number>;
  enabledIf: string[];
}

export interface ContentLoaderPolicy {
  emit: string;
  when: string | null;
  whenAll: string[];
}

export type ContentClosureType =
  | "open"
  | "settle"
  | "bloom"
  | "reveal"
  | "reconcile"
  | "exhaust"
  | "mutate"
  | "recurrence";

export interface ContentDocument {
  id: string;
  arc: string;
  family: string;
  flags: ContentLoaderFlags;
  views: Record<string, ContentLoaderView>;
  commands: Record<string, ContentLoaderCommand>;
  policies: ContentLoaderPolicy[];
  closures: Record<string, ContentClosureType>;
}

export interface ContentLoaderSnapshot {
  enabled: boolean;
  schemaVersion: number;
  documents: ContentDocument[];
}

export interface ContentLoaderOptions {
  capabilities?: KernelCapabilitySnapshot;
  state?: Partial<ContentLoaderSnapshot>;
  documents?: unknown[];
}

export interface ContentLoader {
  loadDocuments(documents: unknown[]): ContentDocument[];
  getDiagnostics(): Record<string, unknown>;
  getDocument(id: string): ContentDocument | null;
  getDocuments(): ContentDocument[];
  snapshot(): ContentLoaderSnapshot;
}

export const CONTENT_LOADER_FLAG: "engine.content.firstPassDsl";
export const CONTENT_LOADER_SCHEMA_VERSION: 1;

export function createContentLoader(options?: ContentLoaderOptions): ContentLoader;
