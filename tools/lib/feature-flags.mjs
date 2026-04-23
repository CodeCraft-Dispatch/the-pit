const validKinds = new Set(["engine", "ui", "content", "kernel"]);
const validExposure = new Set(["hidden", "player", "operator"]);
const validPersistence = new Set(["build", "profile", "world"]);
const resolutionOrder = ["build", "world", "profile", "session"];

function normalizeFlag(flag) {
  return {
    ...flag,
    requires: flag.requires === undefined ? [] : flag.requires,
    testable: flag.testable ?? true,
  };
}

export function indexFeatureFlags(manifest) {
  const index = new Map();
  for (const flag of manifest.flags ?? []) {
    index.set(flag.id, normalizeFlag(flag));
  }
  return index;
}

export function validateFeatureFlagManifest(manifest, options = {}) {
  const path = options.path ?? "(inline manifest)";
  const errors = [];

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return {
      isValid: false,
      errors: [`${path}: manifest must be an object`],
    };
  }

  if (!Number.isInteger(manifest.version) || manifest.version <= 0) {
    errors.push(`${path}: version must be a positive integer`);
  }

  if (!Array.isArray(manifest.flags) || manifest.flags.length === 0) {
    errors.push(`${path}: flags must be a non-empty array`);
  }

  const ids = new Set();

  for (const [index, rawFlag] of (manifest.flags ?? []).entries()) {
    const prefix = `${path}: flags[${index}]`;
    const flag = normalizeFlag(rawFlag);

    if (typeof flag.id !== "string" || flag.id.trim().length === 0) {
      errors.push(`${prefix}: id must be a non-empty string`);
    } else if (ids.has(flag.id)) {
      errors.push(`${prefix}: duplicate id \"${flag.id}\"`);
    } else {
      ids.add(flag.id);
    }

    if (!validKinds.has(flag.kind)) {
      errors.push(
        `${prefix}: kind must be one of ${Array.from(validKinds).join(", ")}`,
      );
    }

    if (
      typeof flag.description !== "string" ||
      flag.description.trim().length === 0
    ) {
      errors.push(`${prefix}: description must be a non-empty string`);
    }

    if (typeof flag.default !== "boolean") {
      errors.push(`${prefix}: default must be a boolean`);
    }

    if (!validExposure.has(flag.exposure)) {
      errors.push(
        `${prefix}: exposure must be one of ${Array.from(validExposure).join(", ")}`,
      );
    }

    if (!validPersistence.has(flag.persistence)) {
      errors.push(
        `${prefix}: persistence must be one of ${Array.from(validPersistence).join(", ")}`,
      );
    }

    if (typeof flag.mutableAtRuntime !== "boolean") {
      errors.push(`${prefix}: mutableAtRuntime must be a boolean`);
    }

    if (typeof flag.testable !== "boolean") {
      errors.push(`${prefix}: testable must be a boolean when provided`);
    }

    if (!Array.isArray(flag.requires)) {
      errors.push(`${prefix}: requires must be an array when provided`);
    } else {
      for (const requirement of flag.requires) {
        if (
          typeof requirement !== "string" ||
          requirement.trim().length === 0
        ) {
          errors.push(`${prefix}: requires entries must be non-empty strings`);
        }
      }
    }

    if (flag.exposure === "player" && flag.persistence !== "profile") {
      errors.push(
        `${prefix}: player-exposed flags must persist in profile state`,
      );
    }

    if (flag.exposure === "player" && flag.mutableAtRuntime !== true) {
      errors.push(`${prefix}: player-exposed flags must be mutable at runtime`);
    }

    if (flag.persistence === "build" && flag.mutableAtRuntime === true) {
      errors.push(
        `${prefix}: build-persistent flags cannot be mutable at runtime`,
      );
    }

    if (flag.kind === "kernel" && flag.exposure === "player") {
      errors.push(`${prefix}: kernel flags cannot be player-exposed`);
    }
  }

  const flagsById = indexFeatureFlags(manifest);
  for (const [index, rawFlag] of (manifest.flags ?? []).entries()) {
    const prefix = `${path}: flags[${index}]`;
    const flag = normalizeFlag(rawFlag);
    if (!Array.isArray(flag.requires)) {
      continue;
    }
    for (const requirement of flag.requires) {
      if (!flagsById.has(requirement)) {
        errors.push(`${prefix}: requires unknown flag \"${requirement}\"`);
      }
      if (requirement === flag.id) {
        errors.push(`${prefix}: a flag cannot require itself`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function canApplyOverride(flag, source) {
  switch (source) {
    case "build":
      return true;
    case "world":
      return flag.persistence === "world";
    case "profile":
      return flag.persistence === "profile" && flag.exposure === "player";
    case "session":
      return flag.testable === true;
    default:
      return false;
  }
}

function enforceRequirements(values, provenance, flagsById) {
  let changed = true;

  while (changed) {
    changed = false;
    for (const [id, flag] of flagsById.entries()) {
      if (!values[id]) {
        continue;
      }

      const missing = flag.requires.filter(
        (requirement) => values[requirement] !== true,
      );
      if (missing.length === 0) {
        continue;
      }

      values[id] = false;
      provenance[id] = {
        source: "dependency",
        detail: `disabled because ${missing.join(", ")} is not enabled`,
      };
      changed = true;
    }
  }
}

export function resolveFeatureFlags(manifest, layers = {}) {
  const validation = validateFeatureFlagManifest(manifest, {
    path: "feature-flags",
  });
  if (!validation.isValid) {
    throw new Error(validation.errors.join("\n"));
  }

  const flagsById = indexFeatureFlags(manifest);
  const values = {};
  const provenance = {};
  const rejected = [];

  for (const [id, flag] of flagsById.entries()) {
    values[id] = flag.default;
    provenance[id] = { source: "default" };
  }

  for (const source of resolutionOrder) {
    const layer = layers[source] ?? {};

    if (!layer || typeof layer !== "object" || Array.isArray(layer)) {
      rejected.push({
        source,
        reason: "override layer must be an object when provided",
      });
      continue;
    }

    for (const [id, value] of Object.entries(layer)) {
      const flag = flagsById.get(id);

      if (!flag) {
        rejected.push({
          source,
          id,
          reason: "unknown flag",
        });
        continue;
      }

      if (typeof value !== "boolean") {
        rejected.push({
          source,
          id,
          reason: "override value must be boolean",
        });
        continue;
      }

      if (!canApplyOverride(flag, source)) {
        rejected.push({
          source,
          id,
          reason: `flag cannot be overridden from ${source}`,
        });
        continue;
      }

      values[id] = value;
      provenance[id] = { source };
    }
  }

  enforceRequirements(values, provenance, flagsById);

  return {
    values,
    provenance,
    rejected,
    resolutionOrder: [...resolutionOrder],
  };
}
