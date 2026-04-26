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

export interface KernelProcessDefinition {
  id: string;
  state?: KernelProcessState;
  progress?: number;
  settlesAt?: number | null;
}

export interface ProcessStateEventDraft {
  type: string;
  details: Record<string, unknown>;
}

export interface ProcessStateCommand {
  id: string;
  type: "openProcess" | "setProcessState";
  processId: string;
  state?: KernelProcessState;
}

export interface ProcessStateContainer {
  advanceProcesses(): ProcessStateEventDraft[];
  applyCommand(command: ProcessStateCommand): ProcessStateEventDraft[];
  getProcess(processId: string): KernelProcessDefinition | null;
  getProcessCount(): number;
  snapshot(): KernelProcessDefinition[];
}

export const processStateNames: readonly KernelProcessState[];
export const validProcessStates: Set<KernelProcessState>;

export function compareStableStrings(left: string, right: string): number;
export function assertPlainObject(value: unknown, label: string): void;
export function validateSafeIdentifier(value: unknown, label: string): void;
export function validateNonNegativeInteger(value: unknown, label: string): void;
export function validatePositiveInteger(value: unknown, label: string): void;
export function buildProcessRecord(
  process: KernelProcessDefinition,
): Required<KernelProcessDefinition>;
export function sortProcessRecords(
  processes: Iterable<KernelProcessDefinition>,
): KernelProcessDefinition[];
export function createProcessStateContainer(
  processes?: KernelProcessDefinition[],
): ProcessStateContainer;
