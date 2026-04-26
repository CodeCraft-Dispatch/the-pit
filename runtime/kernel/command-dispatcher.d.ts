import type {
  KernelProcessDefinition,
  ProcessStateCommand,
  ProcessStateEventDraft,
} from "./process-state-container.mjs";

export interface KernelCapabilitySnapshot {
  values: Record<string, boolean>;
  provenance?: Record<string, unknown>;
}

export interface QueuedKernelCommand {
  command: ProcessStateCommand;
  receivedOrder: number;
  targetTick: number;
}

export type CommandHandler = (
  command: ProcessStateCommand,
) => ProcessStateEventDraft[];

export interface CommandDispatcherOptions {
  capabilities?: KernelCapabilitySnapshot;
  handlers?: Record<string, CommandHandler>;
  nextCommandOrder?: number;
  queuedCommands?: QueuedKernelCommand[];
}

export interface EnqueueCommandOptions {
  currentTick?: number;
  delayTicks?: number;
}

export interface CommandDispatcher {
  dispatchCommand(command: ProcessStateCommand): ProcessStateEventDraft[];
  dispatchReadyCommands(currentTick: number): ProcessStateEventDraft[];
  enqueueCommand(
    command: ProcessStateCommand,
    options?: EnqueueCommandOptions,
  ): ProcessStateCommand;
  getNextCommandOrder(): number;
  getQueueDepth(): number;
  hasCapability(flagId: string): boolean;
  snapshot(): QueuedKernelCommand[];
}

export function normalizeCommandEnvelope(
  command: ProcessStateCommand,
): ProcessStateCommand;

export function buildQueuedCommandEntries(
  entries?: QueuedKernelCommand[],
): QueuedKernelCommand[];

export function createProcessCommandHandler(processContainer: {
  applyCommand(command: ProcessStateCommand): ProcessStateEventDraft[];
  getProcess?(processId: string): KernelProcessDefinition | null;
}): CommandHandler;

export function createCommandDispatcher(
  options?: CommandDispatcherOptions,
): CommandDispatcher;
