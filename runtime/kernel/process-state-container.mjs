export const processStateNames = Object.freeze([
  "dormant",
  "opened",
  "advancing",
  "waiting",
  "blooming",
  "settling",
  "recurring",
  "drifting",
  "proliferating",
  "exhausted",
  "mutated",
  "occluded",
]);

export const processCommandTypes = Object.freeze([
  "openProcess",
  "setProcessState",
]);

const validProcessStates = new Set(processStateNames);
const validProcessCommandTypes = new Set(processCommandTypes);

export function isValidProcessState(state) {
  return validProcessStates.has(state);
}

export function isValidProcessCommandType(type) {
  return validProcessCommandTypes.has(type);
}

const identifierPattern = /^[A-Za-z0-9._:-]+$/u;

export function compareStableStrings(left, right) {
  // localeCompare can vary across locale/ICU environments, so use direct
  // code-unit comparison to keep replay and snapshot ordering deterministic.
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

export function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

export function validateSafeIdentifier(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 128 ||
    !identifierPattern.test(value)
  ) {
    throw new TypeError(`${label} must be 1-128 safe identifier characters`);
  }
}

export function validateNonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer`);
  }
}

export function validatePositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive safe integer`);
  }
}

export function buildProcessRecord(process) {
  assertPlainObject(process, "process");
  validateSafeIdentifier(process.id, "process.id");

  const state = process.state ?? "dormant";
  if (!isValidProcessState(state)) {
    throw new TypeError(`process ${process.id} has invalid state ${state}`);
  }

  const progress = process.progress ?? 0;
  validateNonNegativeInteger(progress, `process ${process.id} progress`);

  const settlesAt = process.settlesAt ?? null;
  if (settlesAt !== null) {
    validateNonNegativeInteger(settlesAt, `process ${process.id} settlesAt`);
  }

  return {
    id: process.id,
    progress,
    settlesAt,
    state,
  };
}

export function normalizeProcessCommand(command) {
  assertPlainObject(command, "command");

  if (!isValidProcessCommandType(command.type)) {
    throw new TypeError(`unsupported command type ${String(command.type)}`);
  }

  validateSafeIdentifier(command.id, "command.id");
  validateSafeIdentifier(command.processId, "command.processId");

  if (command.type === "setProcessState") {
    if (!isValidProcessState(command.state)) {
      throw new TypeError(`unsupported process state ${String(command.state)}`);
    }
  }

  return {
    id: command.id,
    processId: command.processId,
    state: command.state,
    type: command.type,
  };
}

export function createCommandRejectedEvent(command, reason) {
  return {
    details: {
      commandId: command.id ?? "unknown",
      commandType: command.type ?? "unknown",
      reason,
    },
    type: "CommandRejected",
  };
}

export function sortProcessRecords(processes) {
  return [...processes].sort((left, right) =>
    compareStableStrings(left.id, right.id),
  );
}

function buildProcessMap(processes = []) {
  const processMap = new Map();

  for (const process of processes) {
    const record = buildProcessRecord(process);
    if (processMap.has(record.id)) {
      throw new TypeError(`duplicate process id ${record.id}`);
    }
    processMap.set(record.id, record);
  }

  return processMap;
}

function copyProcess(process) {
  return { ...process };
}

export function createProcessStateContainer(processes = []) {
  const processMap = buildProcessMap(processes);

  function getProcess(processId) {
    validateSafeIdentifier(processId, "processId");
    const process = processMap.get(processId);
    return process ? copyProcess(process) : null;
  }

  function getProcessCount() {
    return processMap.size;
  }

  function applyCommand(command) {
    const normalized = normalizeProcessCommand(command);
    const process = processMap.get(normalized.processId);
    if (!process) {
      return [createCommandRejectedEvent(normalized, "unknown-process")];
    }

    if (normalized.type === "openProcess") {
      if (process.state === "dormant" || process.state === "occluded") {
        process.state = "opened";
        return [
          {
            details: {
              commandId: normalized.id,
              processId: process.id,
              state: process.state,
            },
            type: "ProcessOpened",
          },
        ];
      }

      return [
        {
          details: {
            commandId: normalized.id,
            processId: process.id,
            state: process.state,
          },
          type: "ProcessOpenIgnored",
        },
      ];
    }

    process.state = normalized.state;
    return [
      {
        details: {
          commandId: normalized.id,
          processId: process.id,
          state: process.state,
        },
        type: "ProcessStateSet",
      },
    ];
  }

  function advanceProcesses() {
    const events = [];

    for (const process of sortProcessRecords(processMap.values())) {
      if (process.state === "opened" || process.state === "advancing") {
        process.state = "advancing";
        process.progress += 1;
        events.push({
          details: {
            processId: process.id,
            progress: process.progress,
            state: process.state,
          },
          type: "ProcessAdvanced",
        });

        if (
          process.settlesAt !== null &&
          process.progress >= process.settlesAt
        ) {
          process.state = "settling";
          events.push({
            details: {
              processId: process.id,
              progress: process.progress,
              state: process.state,
            },
            type: "ProcessSettling",
          });
        }
        continue;
      }

      if (process.state === "recurring") {
        events.push({
          details: {
            processId: process.id,
            progress: process.progress,
            state: process.state,
          },
          type: "ProcessRecurringObserved",
        });
      }
    }

    return events;
  }

  function snapshot() {
    return sortProcessRecords(processMap.values()).map(copyProcess);
  }

  return Object.freeze({
    advanceProcesses,
    applyCommand,
    getProcess,
    getProcessCount,
    snapshot,
  });
}
