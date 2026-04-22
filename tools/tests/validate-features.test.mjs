import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const validatorPath = fileURLToPath(
  new URL("../validate-features.mjs", import.meta.url),
);

test("feature validator reports a missing specifications directory clearly", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "the-pit-features-"));
  try {
    const run = spawnSync(process.execPath, [validatorPath], {
      cwd: rootDir,
      encoding: "utf8",
    });
    assert.equal(run.status, 1);
    assert.match(
      run.stderr,
      /missing specifications directory: specifications/,
    );
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
