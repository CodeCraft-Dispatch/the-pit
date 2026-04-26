import {
  assertPlainObject,
  compareStableStrings,
  createCommandRejectedEvent,
  isValidProcessCommandType,
  normalizeProcessCommand,
  validateNonNegativeInteger,
  validatePositiveInteger,
} from "./process-state-container.mjs";

export const COMMAND_DISPATCHER_FLAG = "kernel.module.commandDispatcher";
export const PROCESS_CORE_FLAG = "kernel.wasm.processCore";

function cloneCommand(command) {
  return { ...command };
}

function serializeQueuedCommand(entry) {
  return {
    command: cloneCommand(entry.command),
    receivedOrder: entry.receivedOrder,
    targetTick: entry.targetTick,
  };
}

function compareQueuedCommands(left, right) {
  const tickDiff = left.targetTick - right.targetTick;
  if (tickDiff !== 0) {
    return tickDiff;
  }

  const orderDiff = left.receivedOrder - right.receivedOrder;
  if (orderDiff !== 0) {
    return orderDiff;
  }

  return compareStableStrings(left.command.id, right.command.id);
}

function normalizeQueuedCommand(entry) {
  assertPlainObject(entry, "queued command");
  validateNonNegativeInteger(entry.receivedOrder, "receivedOrder");
  validateNonNegativeInteger(entry.targetTick, "targetTick");

  return {
    command: normalizeCommandEnvelope(entry.command),
    receivedOrder: entry.receivedOrder,
    targetTick: entry.targetTick,
  };
}

export function normalizeCommandEnvelope(command) {
  return normalizeProcessCommand(command);
}

function createDispatchEnvelope(command) {
  assertPlainObject(command, "command");

  return {
    id: command.id,
    type: command.type,
  };
}

export function buildQueuedCommandEntries(entries = []) {
  const queuedCommands = entries.map(normalizeQueuedCommand);
  queuedCommands.sort(compareQueuedCommands);
  return queuedCommands;
}

export function createProcessCommandHandler(processContainer) {
  assertPlainObject(processContainer, "processContainer");

  if (typeof processContainer.applyCommand !== "function") {
    throw new TypeError("processContainer.applyCommand must be a function");
  }

  return (command) => processContainer.applyCommand(command);
}

export function createCommandDispatcher(options = {}) {
  assertPlainObject(options, "options");

  const capabilities = options.capabilities ?? {};
  assertPlainObject(capabilities, "capabilities");
  const capabilityValues = capabilities.values ?? {};
  assertPlainObject(capabilityValues, "capabilities.values");

  const handlers = options.handlers ?? {};
  assertPlainObject(handlers, "handlers");

  let nextCommandOrder = options.nextCommandOrder ?? 1;
  validatePositiveInteger(nextCommandOrder, "nextCommandOrder");

  const queuedCommands = buildQueuedCommandEntries(
    options.queuedCommands ?? [],
  );

  function hasCapability(flagId) {
    if (flagId === COMMAND_DISPATCHER_FLAG) {
      // Keep the reference model compatible with earlier process-core boot
      // snapshots. Once a shell declares the dispatcher flag explicitly, false is
      // treated as a hard module disablement.
      return capabilityValues[COMMAND_DISPATCHER_FLAG] !== false;
    }

    return capabilityValues[flagId] === true;
  }

  function isCommandDispatcherAvailable() {
    return hasCapability(COMMAND_DISPATCHER_FLAG);
  }

  function getCommandFamily(command) {
    if (isValidProcessCommandType(command.type)) {
      return "process";
    }

    return "unsupported";
  }

  function dispatchCommand(command) {
    const dispatchEnvelope = createDispatchEnvelope(command);
    const family = getCommandFamily(dispatchEnvelope);
    const normalized =
      family === "process"
        ? normalizeProcessCommand(command)
        : dispatchEnvelope;

    if (family === "process" && !isCommandDispatcherAvailable()) {
      return [
        createCommandRejectedEvent(
          normalized,
          "capability-disabled:kernel.module.commandDispatcher",
        ),
      ];
    }

    if (family === "process" && !hasCapability(PROCESS_CORE_FLAG)) {
      return [
        createCommandRejectedEvent(
          normalized,
          "capability-disabled:kernel.wasm.processCore",
        ),
      ];
    }

    const handler = handlers[family];
    if (typeof handler !== "function") {
      return [
        createCommandRejectedEvent(normalized, `unsupported-family:${family}`),
      ];
    }

    return handler(normalized);
  }

  function enqueueCommand(command, optionsForCommand = {}) {
    assertPlainObject(optionsForCommand, "optionsForCommand");

    const currentTick = optionsForCommand.currentTick ?? 0;
    const delayTicks = optionsForCommand.delayTicks ?? 1;
    validateNonNegativeInteger(currentTick, "currentTick");
    validatePositiveInteger(delayTicks, "delayTicks");

    const normalized = normalizeCommandEnvelope(command);
    queuedCommands.push({
      command: normalized,
      receivedOrder: nextCommandOrder,
      targetTick: currentTick + delayTicks,
    });
    nextCommandOrder += 1;
    queuedCommands.sort(compareQueuedCommands);

    return normalized;
  }

  function dispatchReadyCommands(currentTick) {
    validateNonNegativeInteger(currentTick, "currentTick");

    let readyCount = 0;
    while (
      readyCount < queuedCommands.length &&
      queuedCommands[readyCount].targetTick <= currentTick
    ) {
      readyCount += 1;
    }

    const events = [];
    for (let index = 0; index < readyCount; index += 1) {
      events.push(...dispatchCommand(queuedCommands[index].command));
    }

    if (readyCount > 0) {
      queuedCommands.splice(0, readyCount);
    }

    return events;
  }

  function getNextCommandOrder() {
    return nextCommandOrder;
  }

  function getQueueDepth() {
    return queuedCommands.length;
  }

  function snapshot() {
    return queuedCommands.map(serializeQueuedCommand);
  }

  return Object.freeze({
    dispatchCommand,
    dispatchReadyCommands,
    enqueueCommand,
    getNextCommandOrder,
    getQueueDepth,
    hasCapability,
    snapshot,
  });
}
