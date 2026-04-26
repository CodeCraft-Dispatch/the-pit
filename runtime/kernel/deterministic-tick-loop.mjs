import {
  assertPlainObject,
  compareStableStrings,
  createCommandRejectedEvent,
  createProcessStateContainer,
  normalizeProcessCommand,
  validateNonNegativeInteger,
  validatePositiveInteger,
  validateSafeIdentifier,
} from "./process-state-container.mjs";

const PROCESS_CORE_FLAG = "kernel.wasm.processCore";
const DIAGNOSTICS_FLAG = "kernel.module.diagnostics";
const SNAPSHOT_SCHEMA_VERSION = 1;

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
      command: normalizeProcessCommand(entry.command),
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
    processContainer: createProcessStateContainer(
      restoredState.processes ?? content.processes,
    ),
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

  const processContainer = initialState.processContainer;
  const queuedCommands = initialState.queuedCommands;
  const eventLog = initialState.eventLog;
  let tick = initialState.tick;
  let nextSequence = initialState.nextSequence;
  let nextCommandOrder = initialState.nextCommandOrder;
  const diagnostics = {
    eventCount: eventLog.length,
    processCount: processContainer.getProcessCount(),
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

  function emitProcessEvents(events) {
    for (const event of events) {
      emit(event.type, event.details);
    }
  }

  function rejectCommand(command, reason) {
    diagnostics.rejectedCommandCount += 1;
    const event = createCommandRejectedEvent(command, reason);
    emit(event.type, event.details);
  }

  function applyCommand(command) {
    if (!hasCapability(PROCESS_CORE_FLAG)) {
      rejectCommand(command, "capability-disabled:kernel.wasm.processCore");
      return;
    }

    const events = processContainer.applyCommand(command);
    const rejectedEvents = events.filter((event) => event.type === "CommandRejected");
    diagnostics.rejectedCommandCount += rejectedEvents.length;
    emitProcessEvents(events);
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

    if (hasCapability(PROCESS_CORE_FLAG)) {
      emitProcessEvents(processContainer.advanceProcesses());
    }

    diagnostics.processCount = processContainer.getProcessCount();
    diagnostics.queueDepth = queuedCommands.length;
  }

  function enqueueCommand(command) {
    const normalized = normalizeProcessCommand(command);
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
    return processContainer.getProcess(processId);
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
      processes: processContainer.snapshot(),
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
