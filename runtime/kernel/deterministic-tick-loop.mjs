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
} from "./process-state-container.mjs";
import { createSemanticEventLog } from "./semantic-event-log.mjs";

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

function compareCapabilityValues(left, right) {
  return JSON.stringify(left.values) === JSON.stringify(right.values);
}

function createEventLogState(restoredState) {
  if (restoredState.semanticEventLog) {
    return restoredState.semanticEventLog;
  }

  return {
    eventLog: restoredState.eventLog ?? [],
    nextSequence: restoredState.nextSequence ?? 1,
  };
}

function createInitialState(options, capabilitySnapshot) {
  const restoredState = options.state ?? {};
  assertPlainObject(restoredState, "state");
  const content = options.content ?? { processes: [] };
  assertPlainObject(content, "content");

  return {
    eventLog: createSemanticEventLog({
      capabilities: capabilitySnapshot,
      state: createEventLogState(restoredState),
    }),
    nextCommandOrder: restoredState.nextCommandOrder ?? 1,
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

  const initialState = createInitialState(options, capabilitySnapshot);
  validatePositiveInteger(initialState.nextCommandOrder, "nextCommandOrder");
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
  const diagnostics = {
    eventCount: eventLog.getEventCount(),
    processCount: processContainer.getProcessCount(),
    queueDepth: commandDispatcher.getQueueDepth(),
    rejectedCommandCount: 0,
    semanticEventLog: eventLog.getDiagnostics(),
    tickCount: tick,
  };

  function hasCapability(flagId) {
    return capabilitySnapshot.values[flagId] === true;
  }

  function syncEventDiagnostics() {
    diagnostics.eventCount = eventLog.getEventCount();
    diagnostics.semanticEventLog = eventLog.getDiagnostics();
  }

  function emit(type, details = {}) {
    const event = eventLog.appendEvent(
      {
        details,
        type,
      },
      { tick },
    );
    syncEventDiagnostics();
    return event;
  }

  function emitProcessEvents(events) {
    let rejectedCount = 0;
    const emittedEvents = [];
    for (const event of events) {
      if (event.type === "CommandRejected") {
        rejectedCount += 1;
      }
      const emitted = emit(event.type, event.details);
      if (emitted) {
        emittedEvents.push(emitted);
      }
    }
    return {
      emittedEvents,
      rejectedCount,
    };
  }

  function processQueuedCommandsForCurrentTick() {
    const dispatchedEvents = commandDispatcher.dispatchReadyCommands(tick);
    const result = emitProcessEvents(dispatchedEvents);
    diagnostics.rejectedCommandCount += result.rejectedCount;
    diagnostics.queueDepth = commandDispatcher.getQueueDepth();
    return result.emittedEvents;
  }

  function step() {
    tick += 1;
    diagnostics.tickCount = tick;

    const emittedEvents = processQueuedCommandsForCurrentTick();

    if (hasCapability(PROCESS_CORE_FLAG)) {
      emittedEvents.push(
        ...emitProcessEvents(processContainer.advanceProcesses()).emittedEvents,
      );
    }

    diagnostics.processCount = processContainer.getProcessCount();
    diagnostics.queueDepth = commandDispatcher.getQueueDepth();
    syncEventDiagnostics();

    return emittedEvents;
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

    const emittedEvents = [];
    for (let index = 0; index < tickCount; index += 1) {
      emittedEvents.push(...step());
    }

    return emittedEvents;
  }

  function getEvents() {
    return eventLog.getEvents();
  }

  function findEventsByType(type) {
    return eventLog.findEventsByType(type);
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
    const semanticEventLog = eventLog.snapshot();

    return {
      capabilitySnapshot: capabilityDetails(capabilitySnapshot),
      eventLog: semanticEventLog.events,
      manifestVersion,
      nextCommandOrder: commandDispatcher.getNextCommandOrder(),
      nextSequence: semanticEventLog.nextSequence,
      processes: processContainer.snapshot(),
      queuedCommands: commandDispatcher.snapshot(),
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      seed,
      semanticEventLog,
      tick,
    };
  }

  return Object.freeze({
    advance,
    enqueueCommand,
    findEventsByType,
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
      semanticEventLog: snapshot.semanticEventLog,
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
