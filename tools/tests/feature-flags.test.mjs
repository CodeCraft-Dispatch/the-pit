import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveFeatureFlags,
  validateFeatureFlagManifest,
} from "../lib/feature-flags.mjs";

function createManifest() {
  return {
    version: 1,
    flags: [
      {
        id: "engine.runtime.featureFlags",
        kind: "engine",
        description: "Enable flag resolution.",
        default: true,
        exposure: "hidden",
        persistence: "build",
        mutableAtRuntime: false,
        testable: true,
      },
      {
        id: "ui.playerSettings.flagsPanel",
        kind: "ui",
        description: "Expose a player-facing flags panel.",
        default: false,
        exposure: "player",
        persistence: "profile",
        mutableAtRuntime: true,
        testable: true,
        requires: ["engine.runtime.featureFlags"],
      },
      {
        id: "content.arc.mirrorDistrict",
        kind: "content",
        description: "Enable a modular mirror district.",
        default: false,
        exposure: "hidden",
        persistence: "world",
        mutableAtRuntime: false,
        testable: true,
        requires: ["engine.runtime.featureFlags"],
      },
      {
        id: "kernel.wasm.processCore",
        kind: "kernel",
        description: "Enable the Wasm process core.",
        default: false,
        exposure: "hidden",
        persistence: "build",
        mutableAtRuntime: false,
        testable: true,
        requires: ["engine.runtime.featureFlags"],
      },
    ],
  };
}

test("valid feature flag manifest passes validation", () => {
  const result = validateFeatureFlagManifest(createManifest(), {
    path: "config/feature-flags.json",
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test("player-exposed flag must persist in profile state", () => {
  const manifest = createManifest();
  manifest.flags[1].persistence = "world";

  const result = validateFeatureFlagManifest(manifest, {
    path: "config/feature-flags.json",
  });

  assert.equal(result.isValid, false);
  assert.match(
    result.errors[0],
    /player-exposed flags must persist in profile state/,
  );
});

test("requires must be an array when provided", () => {
  const manifest = createManifest();
  manifest.flags[1].requires = "engine.runtime.featureFlags";

  const result = validateFeatureFlagManifest(manifest, {
    path: "config/feature-flags.json",
  });

  assert.equal(result.isValid, false);
  assert.match(result.errors[0], /requires must be an array when provided/);
});

test("flag resolution applies deterministic override precedence", () => {
  const resolved = resolveFeatureFlags(createManifest(), {
    build: {
      "kernel.wasm.processCore": true,
    },
    world: {
      "content.arc.mirrorDistrict": true,
    },
    profile: {
      "ui.playerSettings.flagsPanel": true,
    },
    session: {
      "content.arc.mirrorDistrict": false,
    },
  });

  assert.equal(resolved.values["kernel.wasm.processCore"], true);
  assert.equal(resolved.values["ui.playerSettings.flagsPanel"], true);
  assert.equal(resolved.values["content.arc.mirrorDistrict"], false);
  assert.deepEqual(resolved.provenance["content.arc.mirrorDistrict"], {
    source: "session",
  });
});

test("hidden flags reject profile overrides", () => {
  const resolved = resolveFeatureFlags(createManifest(), {
    profile: {
      "content.arc.mirrorDistrict": true,
    },
  });

  assert.equal(resolved.values["content.arc.mirrorDistrict"], false);
  assert.deepEqual(resolved.rejected[0], {
    source: "profile",
    id: "content.arc.mirrorDistrict",
    reason: "flag cannot be overridden from profile",
  });
});

test("dependencies disable flags whose requirements are not enabled", () => {
  const resolved = resolveFeatureFlags(createManifest(), {
    build: {
      "engine.runtime.featureFlags": false,
      "kernel.wasm.processCore": true,
    },
    profile: {
      "ui.playerSettings.flagsPanel": true,
    },
    world: {
      "content.arc.mirrorDistrict": true,
    },
  });

  assert.equal(resolved.values["engine.runtime.featureFlags"], false);
  assert.equal(resolved.values["kernel.wasm.processCore"], false);
  assert.equal(resolved.values["ui.playerSettings.flagsPanel"], false);
  assert.equal(resolved.values["content.arc.mirrorDistrict"], false);
  assert.equal(
    resolved.provenance["kernel.wasm.processCore"].source,
    "dependency",
  );
});
