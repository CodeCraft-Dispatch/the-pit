import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateRepoContract } from "../lib/repo-contract.mjs";

function seedRepository(rootDir) {
  const files = {
    "README.md": "# The Pit\n",
    "AGENTS.md": "# AGENTS\n",
    "package.json": "{}\n",
    "netlify.toml": "[build]\n",
    "config/feature-flags.json": "{\"version\":1,\"flags\":[]}\n",
    "specifications/README.md": "# Specifications\n",
    "specifications/foundations/bootstrap.feature":
      "Feature: Delivery\n\nScenario: Green path\n  Given a slice\n  When we validate it\n  Then the contract passes\n",
    "docs/knowledge-base/README.md":
      "- engineering-foundations.md\n- feature-flags.md\n- delivery-pipeline.md\n- security-standards.md\n",
    "docs/knowledge-base/engineering-foundations.md":
      "# Engineering Foundations\n",
    "docs/knowledge-base/feature-flags.md": "# Feature Flags\n",
    "docs/knowledge-base/delivery-pipeline.md": "# Delivery Pipeline\n",
    "docs/knowledge-base/security-standards.md": "# Security Standards\n",
    "codex/instructions/engineering-workflow.md": "# Engineering Workflow\n",
    "codex/agents/reactive-architect.md": "# Reactive Architect\n",
    "codex/agents/quality-guardian.md": "# Quality Guardian\n",
    "codex/skills/test-first-slice/README.md": "# Test First Slice\n",
  };

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = join(rootDir, relativePath);
    mkdirSync(join(absolutePath, ".."), { recursive: true });
    writeFileSync(absolutePath, content, "utf8");
  }
}

test("repository contract passes when required files exist", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "the-pit-contract-"));
  try {
    seedRepository(rootDir);
    const result = validateRepoContract(rootDir);
    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("repository contract fails when required files are missing", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "the-pit-contract-"));
  try {
    seedRepository(rootDir);
    rmSync(join(rootDir, "netlify.toml"));
    const result = validateRepoContract(rootDir);
    assert.equal(result.isValid, false);
    assert.match(result.errors[0], /missing required path: netlify.toml/);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("repository contract fails when specifications has no feature files", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "the-pit-contract-"));
  try {
    seedRepository(rootDir);
    rmSync(join(rootDir, "specifications/foundations/bootstrap.feature"));
    const result = validateRepoContract(rootDir);
    assert.equal(result.isValid, false);
    assert.match(
      result.errors[0],
      /specifications directory must contain at least one \.feature file/,
    );
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
