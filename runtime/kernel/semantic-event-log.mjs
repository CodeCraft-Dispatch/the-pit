import {
  assertPlainObject,
  compareStableStrings,
  validateNonNegativeInteger,
  validatePositiveInteger,
  validateSafeIdentifier,
} from "./process-state-container.mjs";

export const SEMANTIC_EVENT_LOG_FLAG = "kernel.module.semanticEventLog";
export const SEMANTIC_EVENT_LOG_SCHEMA_VERSION = 1;
const JSON_SAFE_EVENT_DETAILS_ERROR =
  "event.details values must be JSON-safe primitives, arrays, or plain objects";

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
      throw new TypeError("event.details values must be finite numbers");
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(cloneJsonValue);
  }

  if (value && typeof value === "object") {
    return cloneSortedRecord(value);
  }

  throw new TypeError(JSON_SAFE_EVENT_DETAILS_ERROR);
}

function cloneSortedRecord(record = {}) {
  assertPlainObject(record, "record");
  const prototype = Object.getPrototypeOf(record);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(JSON_SAFE_EVENT_DETAILS_ERROR);
  }
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, value]) => [key, cloneJsonValue(value)])
      .sort(([left], [right]) => compareStableStrings(left, right)),
  );
}

function validateEventDetailKeys(details) {
  assertPlainObject(details, "event.details");
  for (const key of Object.keys(details)) {
    validateSafeIdentifier(key, "event.details key");
  }
}

function cloneEventDetails(details = {}) {
  validateEventDetailKeys(details);
  return cloneSortedRecord(details);
}

export function normalizeSemanticEventDraft(event) {
  assertPlainObject(event, "event");
  validateSafeIdentifier(event.type, "event.type");

  return {
    details: cloneEventDetails(event.details ?? {}),
    type: event.type,
  };
}

export function cloneSemanticEvent(event) {
  assertPlainObject(event, "event");
  validatePositiveInteger(event.sequence, "event.sequence");
  validateNonNegativeInteger(event.tick, "event.tick");

  const normalized = normalizeSemanticEventDraft(event);

  return {
    details: normalized.details,
    sequence: event.sequence,
    tick: event.tick,
    type: normalized.type,
  };
}

function compareEvents(left, right) {
  const sequenceDiff = left.sequence - right.sequence;
  if (sequenceDiff !== 0) {
    return sequenceDiff;
  }

  const tickDiff = left.tick - right.tick;
  if (tickDiff !== 0) {
    return tickDiff;
  }

  return compareStableStrings(left.type, right.type);
}

function cloneEventLog(events = []) {
  if (!Array.isArray(events)) {
    throw new TypeError("events must be an array");
  }

  const clonedEvents = events.map(cloneSemanticEvent).sort(compareEvents);
  const seenSequences = new Set();

  for (const event of clonedEvents) {
    if (seenSequences.has(event.sequence)) {
      throw new TypeError(
        `duplicate semantic event sequence ${event.sequence}`,
      );
    }
    seenSequences.add(event.sequence);
  }

  return clonedEvents;
}

function validateNextSequenceAfterEvents(events, nextSequence) {
  for (const event of events) {
    if (event.sequence >= nextSequence) {
      throw new RangeError(
        `nextSequence must be greater than semantic event sequence ${event.sequence}`,
      );
    }
  }
}

function isSemanticEventLogEnabled(capabilityValues) {
  return capabilityValues[SEMANTIC_EVENT_LOG_FLAG] !== false;
}

export function createSemanticEventLog(options = {}) {
  assertPlainObject(options, "options");

  const capabilities = options.capabilities ?? {};
  assertPlainObject(capabilities, "capabilities");
  const capabilityValues = capabilities.values ?? {};
  assertPlainObject(capabilityValues, "capabilities.values");

  const state = options.state ?? {};
  assertPlainObject(state, "state");

  const schemaVersion =
    state.schemaVersion ?? SEMANTIC_EVENT_LOG_SCHEMA_VERSION;
  if (schemaVersion !== SEMANTIC_EVENT_LOG_SCHEMA_VERSION) {
    throw new Error(
      `SEMANTIC_EVENT_LOG_SCHEMA_MISMATCH: expected ${SEMANTIC_EVENT_LOG_SCHEMA_VERSION} but received ${schemaVersion}`,
    );
  }

  const enabled = isSemanticEventLogEnabled(capabilityValues);
  let nextSequence = state.nextSequence ?? 1;
  validatePositiveInteger(nextSequence, "nextSequence");

  const events = enabled
    ? cloneEventLog(state.events ?? state.eventLog ?? [])
    : [];
  validateNextSequenceAfterEvents(events, nextSequence);

  function appendEvent(event, optionsForEvent = {}) {
    assertPlainObject(optionsForEvent, "optionsForEvent");
    const tick = optionsForEvent.tick ?? 0;
    validateNonNegativeInteger(tick, "event.tick");

    const normalized = normalizeSemanticEventDraft(event);

    if (!enabled) {
      return null;
    }

    const storedEvent = {
      details: normalized.details,
      sequence: nextSequence,
      tick,
      type: normalized.type,
    };
    nextSequence += 1;
    events.push(storedEvent);

    return cloneSemanticEvent(storedEvent);
  }

  function getEvents() {
    return enabled ? events.map(cloneSemanticEvent) : [];
  }

  function getEventCount() {
    return enabled ? events.length : 0;
  }

  function getNextSequence() {
    return nextSequence;
  }

  function findEventsByType(type) {
    validateSafeIdentifier(type, "event.type");
    return enabled
      ? events.filter((event) => event.type === type).map(cloneSemanticEvent)
      : [];
  }

  function getDiagnostics() {
    return {
      enabled,
      eventCount: getEventCount(),
      nextSequence,
      schemaVersion: SEMANTIC_EVENT_LOG_SCHEMA_VERSION,
    };
  }

  function snapshot() {
    return {
      enabled,
      events: getEvents(),
      nextSequence,
      schemaVersion: SEMANTIC_EVENT_LOG_SCHEMA_VERSION,
    };
  }

  return Object.freeze({
    appendEvent,
    findEventsByType,
    getDiagnostics,
    getEventCount,
    getEvents,
    getNextSequence,
    snapshot,
  });
}
