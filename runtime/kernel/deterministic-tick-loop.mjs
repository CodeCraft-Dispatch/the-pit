import {
  createCommandDispatcher,
  createProcessCommandHandler,
  normalizeCommandEnvelope,
} from "./command-dispatcher.mjs";
import {
  assertPlainObject,
  compareStableStrings,
  createProcessStateContainer,
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
    queuedCommands: restoredState.queuedCommands ?? [],
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
  const commandDispatcher = createCommandDispatcher({
    capabilities: capabilitySnapshot,
    handlers: {
      process: createProcessCommandHandler(processContainer),
    },
    nextCommandOrder: initialState.nextCommandOrder,
    queuedCommands: initialState.queuedCommands,
  });
  const eventLog = initialState.eventLog;
  let tick = initialState.tick;
  let nextSequence = initialState.nextSequence;
  const diagnostics = {
    eventCount: eventLog.length,
    processCount: processContainer.getProcessCount(),
    queueDepth: commandDispatcher.getQueueDepth(),
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
    let rejectedCount = 0;
    for (const event of events) {
      if (event.type === "CommandRejected") {
        rejectedCount += 1;
      }
      emit(event.type, event.details);
    }
    return rejectedCount;
  }

  function processQueuedCommandsForCurrentTick() {
    const dispatchedEvents = commandDispatcher.dispatchReadyCommands(tick);
    diagnostics.rejectedCommandCount += emitProcessEvents(dispatchedEvents);
    diagnostics.queueDepth = commandDispatcher.getQueueDepth();
  }

  function step() {
    tick += 1;
    diagnostics.tickCount = tick;

    processQueuedCommandsForCurrentTick();

    if (hasCapability(PROCESS_CORE_FLAG)) {
      emitProcessEvents(processContainer.advanceProcesses());
    }

    diagnostics.processCount = processContainer.getProcessCount();
    diagnostics.queueDepth = commandDispatcher.getQueueDepth();
  }

  function enqueueCommand(command) {
    const normalized = commandDispatcher.enqueueCommand(command, {
      currentTick: tick,
    });
    diagnostics.queueDepth = commandDispatcher.getQueueDepth();
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
      nextCommandOrder: commandDispatcher.getNextCommandOrder(),
      nextSequence,
      processes: processContainer.snapshot(),
      queuedCommands: commandDispatcher.snapshot(),
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
    commands.push(normalizeCommandEnvelope(entry.command));
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
