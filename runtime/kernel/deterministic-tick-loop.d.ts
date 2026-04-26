export type KernelProcessState =
  | "dormant"
  | "opened"
  | "advancing"
  | "waiting"
  | "blooming"
  | "settling"
  | "recurring"
  | "drifting"
  | "proliferating"
  | "exhausted"
  | "mutated"
  | "occluded";

export interface KernelCapabilitySnapshot {
  values: Record<string, boolean>;
  provenance?: Record<string, unknown>;
}

export interface KernelProcessDefinition {
  id: string;
  state?: KernelProcessState;
  progress?: number;
  settlesAt?: number | null;
}

export interface KernelCommandEnvelope {
  id: string;
  type: "openProcess" | "setProcessState";
  processId: string;
  state?: KernelProcessState;
}

export interface KernelEvent {
  sequence: number;
  tick: number;
  type: string;
  details: Record<string, unknown>;
}

export interface KernelSnapshot {
  capabilitySnapshot: KernelCapabilitySnapshot;
  eventLog: KernelEvent[];
  manifestVersion: number;
  nextCommandOrder: number;
  nextSequence: number;
  processes: KernelProcessDefinition[];
  queuedCommands: Array<{
    command: KernelCommandEnvelope;
    receivedOrder: number;
    targetTick: number;
  }>;
  schemaVersion: number;
  seed: string;
  tick: number;
}

export interface DeterministicTickLoopOptions {
  capabilities?: KernelCapabilitySnapshot;
  content?: {
    processes?: KernelProcessDefinition[];
  };
  commandStream?: Array<{
    tick: number;
    command: KernelCommandEnvelope;
  }>;
  manifestVersion?: number;
  seed?: string;
  state?: Partial<KernelSnapshot>;
  ticks?: number;
}

export interface DeterministicTickLoop {
  advance(
    tickCount?: number,
    commands?: KernelCommandEnvelope[],
  ): KernelEvent[];
  enqueueCommand(command: KernelCommandEnvelope): KernelCommandEnvelope;
  getDiagnostics(): Record<string, unknown> | null;
  getEvents(): KernelEvent[];
  getProcess(processId: string): KernelProcessDefinition | null;
  hasCapability(flagId: string): boolean;
  snapshot(): KernelSnapshot;
}

export function createDeterministicTickLoop(
  options?: DeterministicTickLoopOptions,
): DeterministicTickLoop;

export function restoreDeterministicTickLoop(
  snapshot: KernelSnapshot,
  options?: DeterministicTickLoopOptions,
): DeterministicTickLoop;

export function replayDeterministicTicks(
  options?: DeterministicTickLoopOptions,
): {
  events: KernelEvent[];
  snapshot: KernelSnapshot;
};
