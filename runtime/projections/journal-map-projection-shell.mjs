import {
  assertPlainObject,
  compareStableStrings,
  validateNonNegativeInteger,
  validatePositiveInteger,
  validateSafeIdentifier,
} from "../kernel/process-state-container.mjs";
import {
  cloneSemanticEvent,
  SEMANTIC_EVENT_LOG_FLAG,
} from "../kernel/semantic-event-log.mjs";

export const JOURNAL_MAP_PROJECTION_FLAG = "engine.projection.journalMap";
export const JOURNAL_MAP_PROJECTION_SCHEMA_VERSION = 1;

const PROCESS_NODE_KIND = "process";
const COMMAND_NODE_KIND = "command";
const COMMAND_TARGET_EDGE_TYPE = "command.target";
const MAX_SUMMARY_LENGTH = 512;

function cloneJsonValue(value) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("projection details values must be finite numbers");
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(cloneJsonValue);
  }

  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(
        "projection details values must be JSON-safe primitives, arrays, or plain objects",
      );
    }
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, detailValue]) => [key, cloneJsonValue(detailValue)])
        .sort(([left], [right]) => compareStableStrings(left, right)),
    );
  }

  throw new TypeError(
    "projection details values must be JSON-safe primitives, arrays, or plain objects",
  );
}

function cloneDetails(details) {
  assertPlainObject(details, "projection details");
  return cloneJsonValue(details);
}

function validateProjectionText(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_SUMMARY_LENGTH ||
    /[<>]/u.test(value) ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    throw new TypeError(
      `${label} must be bounded plain text without markup characters`,
    );
  }
}

function capabilityValuesFrom(capabilities) {
  assertPlainObject(capabilities, "capabilities");
  const values = capabilities.values ?? {};
  assertPlainObject(values, "capabilities.values");
  return values;
}

function isProjectionEnabled(capabilityValues) {
  return (
    capabilityValues[JOURNAL_MAP_PROJECTION_FLAG] !== false &&
    capabilityValues[SEMANTIC_EVENT_LOG_FLAG] !== false
  );
}

function extractOptionalSafeIdentifier(details, key) {
  const value = details[key];
  if (value === undefined || value === null) {
    return null;
  }

  validateSafeIdentifier(value, `event.details ${key}`);
  return value;
}

function buildJournalSummary(event, identifiers) {
  if (identifiers.processId && identifiers.commandId) {
    return `${event.type} for ${identifiers.processId} from ${identifiers.commandId} at tick ${event.tick}.`;
  }

  if (identifiers.processId) {
    return `${event.type} for ${identifiers.processId} at tick ${event.tick}.`;
  }

  if (identifiers.commandId) {
    return `${event.type} from ${identifiers.commandId} at tick ${event.tick}.`;
  }

  return `${event.type} at tick ${event.tick}.`;
}

function createJournalEntry(event) {
  const identifiers = {
    commandId: extractOptionalSafeIdentifier(event.details, "commandId"),
    processId: extractOptionalSafeIdentifier(event.details, "processId"),
  };
  const summary = buildJournalSummary(event, identifiers);
  validateProjectionText(summary, "journal summary");

  return {
    commandId: identifiers.commandId,
    details: cloneDetails(event.details),
    eventType: event.type,
    id: `journal.${event.sequence}`,
    processId: identifiers.processId,
    sequence: event.sequence,
    summary,
    tick: event.tick,
  };
}

function normalizeJournalEntry(entry) {
  assertPlainObject(entry, "journal entry");
  validateSafeIdentifier(entry.id, "journal entry id");
  validatePositiveInteger(entry.sequence, "journal entry sequence");
  validateNonNegativeInteger(entry.tick, "journal entry tick");
  validateSafeIdentifier(entry.eventType, "journal entry eventType");
  validateProjectionText(entry.summary, "journal entry summary");

  const processId = entry.processId ?? null;
  const commandId = entry.commandId ?? null;

  if (processId !== null) {
    validateSafeIdentifier(processId, "journal entry processId");
  }

  if (commandId !== null) {
    validateSafeIdentifier(commandId, "journal entry commandId");
  }

  return {
    commandId,
    details: cloneDetails(entry.details ?? {}),
    eventType: entry.eventType,
    id: entry.id,
    processId,
    sequence: entry.sequence,
    summary: entry.summary,
    tick: entry.tick,
  };
}

function compareJournalEntries(left, right) {
  const sequenceDiff = left.sequence - right.sequence;
  if (sequenceDiff !== 0) {
    return sequenceDiff;
  }

  return compareStableStrings(left.id, right.id);
}

function normalizeEventTypes(eventTypes) {
  if (!Array.isArray(eventTypes)) {
    throw new TypeError("map node eventTypes must be an array");
  }

  const normalized = [];
  const seen = new Set();
  for (const eventType of eventTypes) {
    validateSafeIdentifier(eventType, "map node eventType");
    if (!seen.has(eventType)) {
      normalized.push(eventType);
      seen.add(eventType);
    }
  }

  return normalized.sort(compareStableStrings);
}

function normalizeMapNode(node) {
  assertPlainObject(node, "map node");
  validateSafeIdentifier(node.id, "map node id");
  if (node.kind !== PROCESS_NODE_KIND && node.kind !== COMMAND_NODE_KIND) {
    throw new TypeError("map node kind must be process or command");
  }
  validatePositiveInteger(node.firstSequence, "map node firstSequence");
  validatePositiveInteger(node.lastSequence, "map node lastSequence");
  validateNonNegativeInteger(node.lastTick, "map node lastTick");

  return {
    eventTypes: normalizeEventTypes(node.eventTypes ?? []),
    firstSequence: node.firstSequence,
    id: node.id,
    kind: node.kind,
    lastSequence: node.lastSequence,
    lastTick: node.lastTick,
  };
}

function normalizeMapEdge(edge) {
  assertPlainObject(edge, "map edge");
  validateSafeIdentifier(edge.id, "map edge id");
  validateSafeIdentifier(edge.from, "map edge from");
  validateSafeIdentifier(edge.to, "map edge to");
  validateSafeIdentifier(edge.type, "map edge type");
  validatePositiveInteger(edge.firstSequence, "map edge firstSequence");
  validatePositiveInteger(edge.lastSequence, "map edge lastSequence");
  validateNonNegativeInteger(edge.lastTick, "map edge lastTick");

  return {
    firstSequence: edge.firstSequence,
    from: edge.from,
    id: edge.id,
    lastSequence: edge.lastSequence,
    lastTick: edge.lastTick,
    to: edge.to,
    type: edge.type,
  };
}

function compareMapNodes(left, right) {
  const kindDiff = compareStableStrings(left.kind, right.kind);
  if (kindDiff !== 0) {
    return kindDiff;
  }

  return compareStableStrings(left.id, right.id);
}

function compareMapEdges(left, right) {
  const fromDiff = compareStableStrings(left.from, right.from);
  if (fromDiff !== 0) {
    return fromDiff;
  }

  const toDiff = compareStableStrings(left.to, right.to);
  if (toDiff !== 0) {
    return toDiff;
  }

  const typeDiff = compareStableStrings(left.type, right.type);
  if (typeDiff !== 0) {
    return typeDiff;
  }

  return compareStableStrings(left.id, right.id);
}

function cloneSemanticMap(map = {}) {
  assertPlainObject(map, "semantic map");
  const nodes = (map.nodes ?? []).map(normalizeMapNode).sort(compareMapNodes);
  const edges = (map.edges ?? []).map(normalizeMapEdge).sort(compareMapEdges);

  return { edges, nodes };
}

function cloneProjectionState(state = {}) {
  assertPlainObject(state, "state");
  const schemaVersion =
    state.schemaVersion ?? JOURNAL_MAP_PROJECTION_SCHEMA_VERSION;
  if (schemaVersion !== JOURNAL_MAP_PROJECTION_SCHEMA_VERSION) {
    throw new Error(
      `JOURNAL_MAP_PROJECTION_SCHEMA_MISMATCH: expected ${JOURNAL_MAP_PROJECTION_SCHEMA_VERSION} but received ${schemaVersion}`,
    );
  }

  const journalEntries = (state.journalEntries ?? [])
    .map(normalizeJournalEntry)
    .sort(compareJournalEntries);
  const semanticMap = cloneSemanticMap(state.semanticMap ?? {});
  const lastSequence = state.lastSequence ?? 0;
  validateNonNegativeInteger(lastSequence, "lastSequence");

  return {
    journalEntries,
    lastSequence,
    semanticMap,
  };
}

function buildNodeUpdate(existingNode, node) {
  if (!existingNode) {
    return node;
  }

  const eventTypes = normalizeEventTypes([
    ...existingNode.eventTypes,
    ...node.eventTypes,
  ]);

  return {
    eventTypes,
    firstSequence: Math.min(existingNode.firstSequence, node.firstSequence),
    id: existingNode.id,
    kind: existingNode.kind,
    lastSequence: Math.max(existingNode.lastSequence, node.lastSequence),
    lastTick: Math.max(existingNode.lastTick, node.lastTick),
  };
}

function buildEdgeUpdate(existingEdge, edge) {
  if (!existingEdge) {
    return edge;
  }

  return {
    firstSequence: Math.min(existingEdge.firstSequence, edge.firstSequence),
    from: existingEdge.from,
    id: existingEdge.id,
    lastSequence: Math.max(existingEdge.lastSequence, edge.lastSequence),
    lastTick: Math.max(existingEdge.lastTick, edge.lastTick),
    to: existingEdge.to,
    type: existingEdge.type,
  };
}

function createNode(kind, id, event) {
  validateSafeIdentifier(id, `${kind} map node id`);
  return {
    eventTypes: [event.type],
    firstSequence: event.sequence,
    id,
    kind,
    lastSequence: event.sequence,
    lastTick: event.tick,
  };
}

function createCommandTargetEdge(commandId, processId, event) {
  return {
    firstSequence: event.sequence,
    from: commandId,
    id: `edge.${event.sequence}`,
    lastSequence: event.sequence,
    lastTick: event.tick,
    to: processId,
    type: COMMAND_TARGET_EDGE_TYPE,
  };
}

function mapNodeKey(node) {
  return `${node.kind}:${node.id}`;
}

function mapEdgeKey(edge) {
  return `${edge.from}:${edge.to}:${edge.type}`;
}

function normalizeIncomingEvents(events) {
  if (!Array.isArray(events)) {
    throw new TypeError("events must be an array");
  }

  const seen = new Set();
  const normalizedEvents = events.map((event) => {
    const normalized = cloneSemanticEvent(event);
    if (seen.has(normalized.sequence)) {
      throw new TypeError(
        `duplicate projection event sequence ${normalized.sequence}`,
      );
    }
    seen.add(normalized.sequence);
    return normalized;
  });

  return normalizedEvents.sort((left, right) => left.sequence - right.sequence);
}

export function createJournalMapProjectionShell(options = {}) {
  assertPlainObject(options, "options");
  const capabilityValues = capabilityValuesFrom(options.capabilities ?? {});
  const enabled = isProjectionEnabled(capabilityValues);
  const restored = enabled ? cloneProjectionState(options.state ?? {}) : null;
  const journalEntries = restored ? [...restored.journalEntries] : [];
  const projectedSequences = new Set(
    journalEntries.map((entry) => entry.sequence),
  );
  let lastSequence = restored?.lastSequence ?? 0;

  const nodeMap = new Map();
  const edgeMap = new Map();

  if (restored) {
    for (const node of restored.semanticMap.nodes) {
      nodeMap.set(mapNodeKey(node), node);
    }
    for (const edge of restored.semanticMap.edges) {
      edgeMap.set(mapEdgeKey(edge), edge);
    }
  }

  function recordNode(node) {
    const key = mapNodeKey(node);
    nodeMap.set(key, buildNodeUpdate(nodeMap.get(key), node));
  }

  function recordEdge(edge) {
    const key = mapEdgeKey(edge);
    edgeMap.set(key, buildEdgeUpdate(edgeMap.get(key), edge));
  }

  function projectEvent(event) {
    const entry = createJournalEntry(event);
    journalEntries.push(entry);
    projectedSequences.add(event.sequence);
    lastSequence = Math.max(lastSequence, event.sequence);

    if (entry.processId) {
      recordNode(createNode(PROCESS_NODE_KIND, entry.processId, event));
    }

    if (entry.commandId) {
      recordNode(createNode(COMMAND_NODE_KIND, entry.commandId, event));
    }

    if (entry.commandId && entry.processId) {
      recordEdge(createCommandTargetEdge(entry.commandId, entry.processId, event));
    }
  }

  function projectEvents(events) {
    if (!enabled) {
      return {
        journalEntries: [],
        semanticMap: { edges: [], nodes: [] },
      };
    }

    for (const event of normalizeIncomingEvents(events)) {
      if (!projectedSequences.has(event.sequence)) {
        projectEvent(event);
      }
    }

    journalEntries.sort(compareJournalEntries);

    return {
      journalEntries: getJournalEntries(),
      semanticMap: getSemanticMap(),
    };
  }

  function getJournalEntries() {
    return enabled ? journalEntries.map(normalizeJournalEntry) : [];
  }

  function getSemanticMap() {
    if (!enabled) {
      return { edges: [], nodes: [] };
    }

    return cloneSemanticMap({
      edges: Array.from(edgeMap.values()),
      nodes: Array.from(nodeMap.values()),
    });
  }

  function getDiagnostics() {
    const semanticMap = getSemanticMap();
    return {
      enabled,
      lastSequence: enabled ? lastSequence : 0,
      mapEdgeCount: semanticMap.edges.length,
      mapNodeCount: semanticMap.nodes.length,
      projectionFlag: JOURNAL_MAP_PROJECTION_FLAG,
      schemaVersion: JOURNAL_MAP_PROJECTION_SCHEMA_VERSION,
      journalEntryCount: getJournalEntries().length,
    };
  }

  function snapshot() {
    return {
      enabled,
      journalEntries: getJournalEntries(),
      lastSequence: enabled ? lastSequence : 0,
      schemaVersion: JOURNAL_MAP_PROJECTION_SCHEMA_VERSION,
      semanticMap: getSemanticMap(),
    };
  }

  if (options.events !== undefined) {
    projectEvents(options.events);
  }

  return Object.freeze({
    getDiagnostics,
    getJournalEntries,
    getSemanticMap,
    projectEvents,
    snapshot,
  });
}
