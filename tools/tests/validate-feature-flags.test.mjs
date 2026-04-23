import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const validatorPath = fileURLToPath(
  new URL("../validate-feature-flags.mjs", import.meta.url),
);

function writeManifest(rootDir, content) {
  const configDir = join(rootDir, "config");
  mkdirSync(configDir, { recursive: true });
  writeFileSync(join(configDir, "feature-flags.json"), content, "utf8");
}

test("feature flag validator reports a missing manifest clearly", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "the-pit-feature-flags-cli-"));
  try {
    const run = spawnSync(process.execPath, [validatorPath], {
      cwd: rootDir,
      encoding: "utf8",
    });
    assert.equal(run.status, 1);
    assert.match(
      run.stderr,
      /missing feature flag manifest: config\/feature-flags\.json/,
    );
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("feature flag validator reports invalid JSON clearly", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "the-pit-feature-flags-cli-"));
  try {
    writeManifest(rootDir, "{invalid");

    const run = spawnSync(process.execPath, [validatorPath], {
      cwd: rootDir,
      encoding: "utf8",
    });

    assert.equal(run.status, 1);
    assert.match(run.stderr, /config\/feature-flags\.json: invalid JSON/);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("feature flag validator reports schema violations", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "the-pit-feature-flags-cli-"));
  try {
    writeManifest(rootDir, JSON.stringify({ version: 0, flags: [] }, null, 2));

    const run = spawnSync(process.execPath, [validatorPath], {
      cwd: rootDir,
      encoding: "utf8",
    });

    assert.equal(run.status, 1);
    assert.match(
      run.stderr,
      /config\/feature-flags\.json: version must be a positive integer/,
    );
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("feature flag validator succeeds for a valid manifest", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "the-pit-feature-flags-cli-"));
  try {
    writeManifest(
      rootDir,
      JSON.stringify(
        {
          version: 1,
          flags: [
            {
              id: "engine.runtime.featureFlags",
              kind: "engine",
              description: "Enable feature flag evaluation.",
              default: true,
              exposure: "hidden",
              persistence: "build",
              mutableAtRuntime: false,
            },
          ],
        },
        null,
        2,
      ),
    );

    const run = spawnSync(process.execPath, [validatorPath], {
      cwd: rootDir,
      encoding: "utf8",
    });

    assert.equal(run.status, 0);
    assert.match(run.stdout, /Feature flag manifest is valid\./);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
