import test from "node:test";
import assert from "node:assert/strict";
import { validateFeatureDocument } from "../lib/feature-grammar.mjs";

test("valid feature document passes grammar checks", () => {
  const source = `Feature: Delivery contract\n\nScenario: Changes start with executable specification\n  Given a proposed behavior change\n  When the slice is defined as an executable example\n  Then implementation can proceed in a test-first loop\n`;

  const result = validateFeatureDocument(source, { path: "example.feature" });
  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test("missing Then step fails grammar checks", () => {
  const source = `Feature: Delivery contract\n\nScenario: Invalid specification\n  Given a proposed behavior change\n  When the slice is defined incompletely\n`;

  const result = validateFeatureDocument(source, { path: "broken.feature" });
  assert.equal(result.isValid, false);
  assert.match(result.errors[0], /missing a Then step/);
});
