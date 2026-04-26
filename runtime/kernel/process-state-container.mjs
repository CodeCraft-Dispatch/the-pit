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

export const validProcessStates = new Set(processStateNames);

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
  if (!validProcessStates.has(state)) {
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

function commandRejected(command, reason) {
  return {
    details: {
      commandId: command.id ?? "unknown",
      commandType: command.type ?? "unknown",
      reason,
    },
    type: "CommandRejected",
  };
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
    assertPlainObject(command, "command");

    const process = processMap.get(command.processId);
    if (!process) {
      return [commandRejected(command, "unknown-process")];
    }

    if (command.type === "openProcess") {
      if (process.state === "dormant" || process.state === "occluded") {
        process.state = "opened";
        return [
          {
            details: {
              commandId: command.id,
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
            commandId: command.id,
            processId: process.id,
            state: process.state,
          },
          type: "ProcessOpenIgnored",
        },
      ];
    }

    if (command.type === "setProcessState") {
      process.state = command.state;
      return [
        {
          details: {
            commandId: command.id,
            processId: process.id,
            state: process.state,
          },
          type: "ProcessStateSet",
        },
      ];
    }

    return [commandRejected(command, `unsupported-command:${String(command.type)}`)];
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

        if (process.settlesAt !== null && process.progress >= process.settlesAt) {
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
