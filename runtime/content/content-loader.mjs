import {
  assertPlainObject,
  compareStableStrings,
  validateNonNegativeInteger,
  validateSafeIdentifier,
} from "../kernel/process-state-container.mjs";

export const CONTENT_LOADER_FLAG = "engine.content.firstPassDsl";
export const CONTENT_LOADER_SCHEMA_VERSION = 1;

const MAX_TEXT_LENGTH = 1024;
const validClosureTypes = new Set([
  "open",
  "settle",
  "bloom",
  "reveal",
  "reconcile",
  "exhaust",
  "mutate",
  "recurrence",
]);

function capabilityValuesFrom(capabilities) {
  assertPlainObject(capabilities, "capabilities");
  const values = capabilities.values ?? {};
  assertPlainObject(values, "capabilities.values");
  return values;
}

function isContentLoaderEnabled(capabilityValues) {
  return capabilityValues[CONTENT_LOADER_FLAG] !== false;
}

function validatePlainText(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_TEXT_LENGTH ||
    /[<>]/u.test(value) ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    throw new TypeError(
      `${label} must be bounded plain text without markup characters`,
    );
  }
}

function normalizeIdentifierArray(values = [], label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array`);
  }

  const normalized = [];
  const seen = new Set();
  for (const value of values) {
    validateSafeIdentifier(value, label);
    if (!seen.has(value)) {
      normalized.push(value);
      seen.add(value);
    }
  }

  return normalized.sort(compareStableStrings);
}

function normalizeFlags(flags = {}) {
  assertPlainObject(flags, "content flags");
  return {
    requires: normalizeIdentifierArray(flags.requires ?? [], "content flag requirement"),
  };
}

function normalizeCosts(costs = {}) {
  assertPlainObject(costs, "command costs");

  return Object.fromEntries(
    Object.entries(costs)
      .map(([key, value]) => {
        validateSafeIdentifier(key, "command cost key");
        validateNonNegativeInteger(value, `command cost ${key}`);
        return [key, value];
      })
      .sort(([left], [right]) => compareStableStrings(left, right)),
  );
}

function normalizeViews(views) {
  assertPlainObject(views, "views");
  const entries = Object.entries(views);
  if (entries.length === 0) {
    throw new TypeError("views must contain at least one view");
  }

  return Object.fromEntries(
    entries
      .map(([id, view]) => {
        validateSafeIdentifier(id, "view id");
        assertPlainObject(view, `view ${id}`);
        validatePlainText(view.text, `view ${id} text`);
        return [id, { text: view.text }];
      })
      .sort(([left], [right]) => compareStableStrings(left, right)),
  );
}

function normalizeCommands(commands = {}) {
  assertPlainObject(commands, "commands");

  return Object.fromEntries(
    Object.entries(commands)
      .map(([id, command]) => {
        validateSafeIdentifier(id, "command id");
        assertPlainObject(command, `command ${id}`);
        return [
          id,
          {
            costs: normalizeCosts(command.costs ?? {}),
            enabledIf: normalizeIdentifierArray(
              command.enabled_if ?? command.enabledIf ?? [],
              `command ${id} enabled_if`,
            ),
          },
        ];
      })
      .sort(([left], [right]) => compareStableStrings(left, right)),
  );
}

function normalizePolicy(policy, index) {
  assertPlainObject(policy, `policy ${index}`);
  validateSafeIdentifier(policy.emit, `policy ${index} emit`);

  const hasWhen = policy.when !== undefined;
  const hasWhenAll = policy.when_all !== undefined || policy.whenAll !== undefined;
  if (hasWhen === hasWhenAll) {
    throw new TypeError(
      `policy ${index} must define exactly one of when or when_all`,
    );
  }

  if (hasWhen) {
    validateSafeIdentifier(policy.when, `policy ${index} when`);
    return {
      emit: policy.emit,
      when: policy.when,
      whenAll: [],
    };
  }

  return {
    emit: policy.emit,
    when: null,
    whenAll: normalizeIdentifierArray(
      policy.when_all ?? policy.whenAll,
      `policy ${index} when_all`,
    ),
  };
}

function policySortKey(policy) {
  return [policy.emit, policy.when ?? "", ...policy.whenAll].join("|");
}

function normalizePolicies(policies = []) {
  if (!Array.isArray(policies)) {
    throw new TypeError("policies must be an array");
  }

  return policies
    .map(normalizePolicy)
    .sort((left, right) => compareStableStrings(policySortKey(left), policySortKey(right)));
}

function normalizeClosures(closures = {}) {
  assertPlainObject(closures, "closures");

  return Object.fromEntries(
    Object.entries(closures)
      .map(([eventType, closureType]) => {
        validateSafeIdentifier(eventType, "closure event type");
        if (!validClosureTypes.has(closureType)) {
          throw new TypeError(`unsupported closure type ${String(closureType)}`);
        }
        return [eventType, closureType];
      })
      .sort(([left], [right]) => compareStableStrings(left, right)),
  );
}

function normalizeDocument(document) {
  assertPlainObject(document, "content document");
  validateSafeIdentifier(document.id, "content document id");
  validateSafeIdentifier(document.arc, `content document ${document.id} arc`);
  validateSafeIdentifier(document.family, `content document ${document.id} family`);

  return {
    arc: document.arc,
    closures: normalizeClosures(document.closures ?? {}),
    commands: normalizeCommands(document.commands ?? {}),
    family: document.family,
    flags: normalizeFlags(document.flags ?? {}),
    id: document.id,
    policies: normalizePolicies(document.policies ?? []),
    views: normalizeViews(document.views ?? {}),
  };
}

function compareDocuments(left, right) {
  return compareStableStrings(left.id, right.id);
}

function normalizeDocuments(documents = []) {
  if (!Array.isArray(documents)) {
    throw new TypeError("documents must be an array");
  }

  const normalized = documents.map(normalizeDocument).sort(compareDocuments);
  const seen = new Set();

  for (const document of normalized) {
    if (seen.has(document.id)) {
      throw new TypeError(`duplicate content document id ${document.id}`);
    }
    seen.add(document.id);
  }

  return normalized;
}

function normalizeState(state = {}) {
  assertPlainObject(state, "state");
  const schemaVersion = state.schemaVersion ?? CONTENT_LOADER_SCHEMA_VERSION;
  if (schemaVersion !== CONTENT_LOADER_SCHEMA_VERSION) {
    throw new Error(
      `CONTENT_LOADER_SCHEMA_MISMATCH: expected ${CONTENT_LOADER_SCHEMA_VERSION} but received ${schemaVersion}`,
    );
  }

  return normalizeDocuments(state.documents ?? []);
}

export function createContentLoader(options = {}) {
  assertPlainObject(options, "options");
  const capabilityValues = capabilityValuesFrom(options.capabilities ?? {});
  const enabled = isContentLoaderEnabled(capabilityValues);
  const documentMap = new Map();

  function replaceDocuments(documents) {
    documentMap.clear();
    for (const document of documents) {
      documentMap.set(document.id, document);
    }
  }

  if (enabled) {
    replaceDocuments(normalizeState(options.state ?? {}));
  }

  function loadDocuments(documents) {
    if (!enabled) {
      return [];
    }

    const normalized = normalizeDocuments(documents);
    replaceDocuments(normalized);
    return getDocuments();
  }

  function getDocuments() {
    return enabled ? normalizeDocuments(Array.from(documentMap.values())) : [];
  }

  function getDocument(id) {
    validateSafeIdentifier(id, "content document id");
    if (!enabled) {
      return null;
    }

    const document = documentMap.get(id);
    return document ? normalizeDocument(document) : null;
  }

  function getDiagnostics() {
    const documents = getDocuments();
    const requiredFlags = normalizeIdentifierArray(
      documents.flatMap((document) => document.flags.requires),
      "content required flag",
    );

    return {
      documentCount: documents.length,
      enabled,
      loaderFlag: CONTENT_LOADER_FLAG,
      requiredFlags,
      schemaVersion: CONTENT_LOADER_SCHEMA_VERSION,
    };
  }

  function snapshot() {
    return {
      documents: getDocuments(),
      enabled,
      schemaVersion: CONTENT_LOADER_SCHEMA_VERSION,
    };
  }

  if (options.documents !== undefined) {
    loadDocuments(options.documents);
  }

  return Object.freeze({
    getDiagnostics,
    getDocument,
    getDocuments,
    loadDocuments,
    snapshot,
  });
}
