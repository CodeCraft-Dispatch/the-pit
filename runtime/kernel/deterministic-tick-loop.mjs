const PROCESS_CORE_FLAG = "kernel.wasm.processCore";
const DIAGNOSTICS_FLAG = "kernel.module.diagnostics";
const SNAPSHOT_SCHEMA_VERSION = 1;

const validProcessStates = new Set([
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
const validCommandTypes = new Set(["openProcess", "setProcessState"]);
const identifierPattern = /^[A-Za-z0-9._:-]+$/u;

function compareStableStrings(left, right) {
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

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function validateSafeIdentifier(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 128 ||
    !identifierPattern.test(value)
  ) {
    throw new TypeError(`${label} must be 1-128 safe identifier characters`);
  }
}

function validateNonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer`);
  }
}

function validatePositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive safe integer`);
  }
}

function cloneJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneJsonValue);
  }

  if (value && typeof value === "object") {
    return cloneSortedRecord(value);
  }

  return value;
}

function cloneSortedRecord(record = {}) {
  assertPlainObject(record, "record");
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, value]) => [key, cloneJsonValue(value)])
      .sort(([left], [right]) => compareStableStrings(left, right)),
  );
}

function copyCapabilitySnapshot(capabilities = {}) {
  assertPlainObject(capabilities, "capabilities");
  const values = cloneSortedRecord(capabilities.values ?? {});
  const provenance = cloneSortedRecord(capabilities.provenance ?? {});

  return Object.freeze({
    values: Object.freeze(values),
    provenance: Object.freeze(provenance),
  });
}

function capabilityDetails(capabilitySnapshot) {
  return {
    values: cloneSortedRecord(capabilitySnapshot.values),
    provenance: cloneSortedRecord(capabilitySnapshot.provenance),
  };
}

function buildProcessRecord(process) {
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

function sortProcesses(processes) {
  return [...processes].sort((left, right) =>
    compareStableStrings(left.id, right.id),
  );
}

function validateCommand(command) {
  assertPlainObject(command, "command");

  if (!validCommandTypes.has(command.type)) {
    throw new TypeError(`unsupported command type ${String(command.type)}`);
  }

  validateSafeIdentifier(command.id, "command.id");
  validateSafeIdentifier(command.processId, "command.processId");

  if (command.type === "setProcessState") {
    if (!validProcessStates.has(command.state)) {
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

function serializeQueuedCommand(entry) {
  return {
    command: { ...entry.command },
    receivedOrder: entry.receivedOrder,
    targetTick: entry.targetTick,
  };
}

function compareQueuedCommands(left, right) {
  const tickDiff = left.targetTick - right.targetTick;
  if (tickDiff !== 0) {
    return tickDiff;
  }
  return left.receivedOrder - right.receivedOrder;
}

function buildQueuedCommands(entries = []) {
  const queuedCommands = entries.map((entry) => {
    assertPlainObject(entry, "queued command");
    validateNonNegativeInteger(entry.receivedOrder, "receivedOrder");
    validateNonNegativeInteger(entry.targetTick, "targetTick");

    return {
      command: validateCommand(entry.command),
      receivedOrder: entry.receivedOrder,
      targetTick: entry.targetTick,
    };
  });

  queuedCommands.sort(compareQueuedCommands);

  return queuedCommands;
}

function cloneEventLog(events = []) {
  return events.map((event) => {
    assertPlainObject(event, "event");
    validatePositiveInteger(event.sequence, "event.sequence");
    validateNonNegativeInteger(event.tick, "event.tick");
    validateSafeIdentifier(event.type, "event.type");

    return {
      details: cloneSortedRecord(event.details ?? {}),
      sequence: event.sequence,
      tick: event.tick,
      type: event.type,
    };
  });
}

function compareCapabilityValues(left, right) {
  return JSON.stringify(left.values) === JSON.stringify(right.values);
}

function createInitialState(options) {
  const restoredState = options.state ?? {};
  assertPlainObject(restoredState, "state");
  const content = options.content ?? { processes: [] };
  assertPlainObject(content, "content");

  return {
    eventLog: cloneEventLog(restoredState.eventLog ?? []),
    nextCommandOrder: restoredState.nextCommandOrder ?? 1,
    nextSequence: restoredState.nextSequence ?? 1,
    processes: buildProcessMap(restoredState.processes ?? content.processes),
    queuedCommands: buildQueuedCommands(restoredState.queuedCommands ?? []),
    tick: restoredState.tick ?? 0,
  };
}

export function createDeterministicTickLoop(options = {}) {
  assertPlainObject(options, "options");

  const capabilitySnapshot = copyCapabilitySnapshot(options.capabilities ?? {});
  const manifestVersion = options.manifestVersion ?? 1;
  const seed = options.seed ?? "seed:0";

  validatePositiveInteger(manifestVersion, "manifestVersion");

  const initialState = createInitialState(options);
  validatePositiveInteger(initialState.nextCommandOrder, "nextCommandOrder");
  validatePositiveInteger(initialState.nextSequence, "nextSequence");
  validateNonNegativeInteger(initialState.tick, "tick");

  const processes = initialState.processes;
  const queuedCommands = initialState.queuedCommands;
  const eventLog = initialState.eventLog;
  let tick = initialState.tick;
  let nextSequence = initialState.nextSequence;
  let nextCommandOrder = initialState.nextCommandOrder;
  const diagnostics = {
    eventCount: eventLog.length,
    processCount: processes.size,
    queueDepth: queuedCommands.length,
    rejectedCommandCount: 0,
    tickCount: tick,
  };

  function hasCapability(flagId) {
    return capabilitySnapshot.values[flagId] === true;
  }

  function emit(type, details = {}) {
    const event = {
      details: cloneSortedRecord(details),
      sequence: nextSequence,
      tick,
      type,
    };
    nextSequence += 1;
    eventLog.push(event);
    diagnostics.eventCount = eventLog.length;
    return event;
  }

  function rejectCommand(command, reason) {
    diagnostics.rejectedCommandCount += 1;
    emit("CommandRejected", {
      commandId: command.id ?? "unknown",
      commandType: command.type ?? "unknown",
      reason,
    });
  }

  function applyCommand(command) {
    if (!hasCapability(PROCESS_CORE_FLAG)) {
      rejectCommand(command, "capability-disabled:kernel.wasm.processCore");
      return;
    }

    const process = processes.get(command.processId);
    if (!process) {
      rejectCommand(command, "unknown-process");
      return;
    }

    if (command.type === "openProcess") {
      if (process.state === "dormant" || process.state === "occluded") {
        process.state = "opened";
        emit("ProcessOpened", {
          commandId: command.id,
          processId: process.id,
          state: process.state,
        });
      } else {
        emit("ProcessOpenIgnored", {
          commandId: command.id,
          processId: process.id,
          state: process.state,
        });
      }
      return;
    }

    process.state = command.state;
    emit("ProcessStateSet", {
      commandId: command.id,
      processId: process.id,
      state: process.state,
    });
  }

  function advanceProcess(process) {
    if (!hasCapability(PROCESS_CORE_FLAG)) {
      return;
    }

    if (process.state === "opened" || process.state === "advancing") {
      process.state = "advancing";
      process.progress += 1;
      emit("ProcessAdvanced", {
        processId: process.id,
        progress: process.progress,
        state: process.state,
      });

      if (process.settlesAt !== null && process.progress >= process.settlesAt) {
        process.state = "settling";
        emit("ProcessSettling", {
          processId: process.id,
          progress: process.progress,
          state: process.state,
        });
      }
      return;
    }

    if (process.state === "recurring") {
      emit("ProcessRecurringObserved", {
        processId: process.id,
        progress: process.progress,
        state: process.state,
      });
    }
  }

  function processQueuedCommandsForCurrentTick() {
    // queuedCommands are kept sorted by compareQueuedCommands, so once we
    // encounter a targetTick beyond the current tick, the remainder are pending.
    let readyCount = 0;
    while (
      readyCount < queuedCommands.length &&
      queuedCommands[readyCount].targetTick <= tick
    ) {
      readyCount += 1;
    }

    for (let index = 0; index < readyCount; index += 1) {
      applyCommand(queuedCommands[index].command);
    }

    if (readyCount > 0) {
      queuedCommands.splice(0, readyCount);
    }

    diagnostics.queueDepth = queuedCommands.length;
  }

  function step() {
    tick += 1;
    diagnostics.tickCount = tick;

    processQueuedCommandsForCurrentTick();

    for (const process of sortProcesses(processes.values())) {
      advanceProcess(process);
    }

    diagnostics.processCount = processes.size;
    diagnostics.queueDepth = queuedCommands.length;
  }

  function enqueueCommand(command) {
    const normalized = validateCommand(command);
    queuedCommands.push({
      command: normalized,
      receivedOrder: nextCommandOrder,
      targetTick: tick + 1,
    });
    nextCommandOrder += 1;
    diagnostics.queueDepth = queuedCommands.length;
    return normalized;
  }

  function advance(tickCount = 1, commands = []) {
    validateNonNegativeInteger(tickCount, "tickCount");

    for (const command of commands) {
      enqueueCommand(command);
    }

    const startSequence = nextSequence;
    for (let index = 0; index < tickCount; index += 1) {
      step();
    }

    return eventLog.filter((event) => event.sequence >= startSequence);
  }

  function getEvents() {
    return cloneEventLog(eventLog);
  }

  function getProcess(processId) {
    validateSafeIdentifier(processId, "processId");
    const process = processes.get(processId);
    return process ? { ...process } : null;
  }

  function getDiagnostics() {
    if (!hasCapability(DIAGNOSTICS_FLAG)) {
      return null;
    }

    return {
      ...diagnostics,
      capabilitySnapshot: capabilityDetails(capabilitySnapshot),
    };
  }

  function snapshot() {
    return {
      capabilitySnapshot: capabilityDetails(capabilitySnapshot),
      eventLog: getEvents(),
      manifestVersion,
      nextCommandOrder,
      nextSequence,
      processes: sortProcesses(processes.values()).map((process) => ({
        ...process,
      })),
      // queuedCommands are maintained in (targetTick, receivedOrder) order,
      // so snapshot serialization keeps this deterministic in-memory order.
      queuedCommands: queuedCommands.map(serializeQueuedCommand),
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      seed,
      tick,
    };
  }

  return Object.freeze({
    advance,
    enqueueCommand,
    getDiagnostics,
    getEvents,
    getProcess,
    hasCapability,
    snapshot,
  });
}

export function restoreDeterministicTickLoop(snapshot, options = {}) {
  assertPlainObject(snapshot, "snapshot");
  assertPlainObject(options, "options");

  if (snapshot.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) {
    throw new Error(
      `SNAPSHOT_SCHEMA_MISMATCH: expected ${SNAPSHOT_SCHEMA_VERSION} but received ${snapshot.schemaVersion}`,
    );
  }

  const snapshotCapabilities = copyCapabilitySnapshot(
    snapshot.capabilitySnapshot ?? {},
  );
  const requestedCapabilities = options.capabilities
    ? copyCapabilitySnapshot(options.capabilities)
    : snapshotCapabilities;

  if (!compareCapabilityValues(snapshotCapabilities, requestedCapabilities)) {
    throw new Error("CAPABILITY_SNAPSHOT_MISMATCH");
  }

  return createDeterministicTickLoop({
    capabilities: snapshotCapabilities,
    manifestVersion: snapshot.manifestVersion,
    seed: snapshot.seed,
    state: {
      eventLog: snapshot.eventLog,
      nextCommandOrder: snapshot.nextCommandOrder,
      nextSequence: snapshot.nextSequence,
      processes: snapshot.processes,
      queuedCommands: snapshot.queuedCommands,
      tick: snapshot.tick,
    },
  });
}

export function replayDeterministicTicks(options = {}) {
  assertPlainObject(options, "options");
  const totalTicks = options.ticks ?? 0;
  validateNonNegativeInteger(totalTicks, "ticks");

  const loop = createDeterministicTickLoop(options);
  const commandsByTick = new Map();

  for (const entry of options.commandStream ?? []) {
    assertPlainObject(entry, "commandStream entry");
    validatePositiveInteger(entry.tick, "commandStream tick");
    const commands = commandsByTick.get(entry.tick) ?? [];
    commands.push(entry.command);
    commandsByTick.set(entry.tick, commands);
  }

  for (let nextTick = 1; nextTick <= totalTicks; nextTick += 1) {
    loop.advance(1, commandsByTick.get(nextTick) ?? []);
  }

  return {
    events: loop.getEvents(),
    snapshot: loop.snapshot(),
  };
}
