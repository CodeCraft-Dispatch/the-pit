import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  buildKnowledgeSite,
  encodePathForHref,
} from "../build-knowledge-site.mjs";

function writeFixtureFile(rootDir, relativePath, content) {
  const absolutePath = join(rootDir, relativePath);
  mkdirSync(join(absolutePath, ".."), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
}

test("knowledge site builder escapes title and encodes generated links", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "the-pit-site-"));
  try {
    writeFixtureFile(
      rootDir,
      "README.md",
      "# <img src=x onerror=alert(1)> Pit & Co\n",
    );
    writeFixtureFile(
      rootDir,
      "docs/knowledge-base/README.md",
      "# Docs Index\n",
    );
    writeFixtureFile(
      rootDir,
      "docs/knowledge-base/guides/alpha & beta<one>.md",
      "# Guide\n",
    );
    writeFixtureFile(rootDir, "specifications/README.md", "# Specs Index\n");
    writeFixtureFile(
      rootDir,
      "specifications/foundations/hello & world.feature",
      "Feature: Hello\n\nScenario: One\n  Given x\n  When y\n  Then z\n",
    );

    const result = buildKnowledgeSite(rootDir);
    assert.equal(result.knowledgeBaseCount, 2);
    assert.equal(result.featureCount, 1);

    const html = readFileSync(join(rootDir, "dist/index.html"), "utf8");
    assert.match(
      html,
      /<title>&lt;img src=x onerror=alert\(1\)&gt; Pit &amp; Co - knowledge base<\/title>/,
    );
    assert.doesNotMatch(
      html,
      /<h1><img src=x onerror=alert\(1\)> Pit & Co<\/h1>/,
    );
    assert.match(
      html,
      /href="knowledge-base\/guides\/alpha%20%26%20beta%3Cone%3E\.md"/,
    );
    assert.match(html, /guides\/alpha &amp; beta&lt;one&gt;\.md/);
    assert.match(
      html,
      /href="specifications\/foundations\/hello%20%26%20world\.feature"/,
    );
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("path encoding normalizes windows separators", () => {
  assert.equal(
    encodePathForHref("guides\\alpha & beta<one>.md"),
    "guides/alpha%20%26%20beta%3Cone%3E.md",
  );
});
