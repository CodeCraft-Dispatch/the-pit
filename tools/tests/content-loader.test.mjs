import test from "node:test";
import assert from "node:assert/strict";
import { createContentLoader } from "../../runtime/content/content-loader.mjs";

const enabledCapabilities = Object.freeze({
  values: {
    "engine.content.firstPassDsl": true,
    "engine.runtime.featureFlags": true,
    "kernel.wasm.processCore": true,
  },
  provenance: {
    "engine.content.firstPassDsl": { source: "build" },
  },
});

const disabledCapabilities = Object.freeze({
  values: {
    "engine.content.firstPassDsl": false,
    "engine.runtime.featureFlags": true,
    "kernel.wasm.processCore": true,
  },
});

function authoredDocument() {
  return {
    id: "archive.room.014",
    family: "archive_room",
    arc: "patterning",
    flags: {
      requires: ["content.arc.mirrorDistrict", "engine.projection.journalMap"],
    },
    views: {
      entry: {
        text: "The inscriptions seem almost familiar.",
      },
    },
    commands: {
      pull_lever_a: {
        costs: { focus: 2, time: 1 },
        enabled_if: ["has_bronze_key"],
      },
      inspect_sigil: {
        costs: { time: 1, focus: 1 },
      },
    },
    policies: [
      { when: "inspect_sigil", emit: "sigil_examined" },
      { when: "pull_lever_a", emit: "lever_a_pulled" },
      {
        when_all: ["lever_a_pulled", "sigil_examined"],
        emit: "chamber_opened",
      },
    ],
    closures: {
      path_looped: "recurrence",
      chamber_opened: "reveal",
    },
  };
}

test("loads first-pass DSL content into deterministic normalized documents", () => {
  const loader = createContentLoader({ capabilities: enabledCapabilities });
  const documents = loader.loadDocuments([authoredDocument()]);

  assert.deepEqual(documents, [
    {
      arc: "patterning",
      closures: {
        chamber_opened: "reveal",
        path_looped: "recurrence",
      },
      commands: {
        inspect_sigil: {
          costs: { focus: 1, time: 1 },
          enabledIf: [],
        },
        pull_lever_a: {
          costs: { focus: 2, time: 1 },
          enabledIf: ["has_bronze_key"],
        },
      },
      family: "archive_room",
      flags: {
        requires: ["content.arc.mirrorDistrict", "engine.projection.journalMap"],
      },
      id: "archive.room.014",
      policies: [
        {
          emit: "chamber_opened",
          when: null,
          whenAll: ["lever_a_pulled", "sigil_examined"],
        },
        {
          emit: "lever_a_pulled",
          when: "pull_lever_a",
          whenAll: [],
        },
        {
          emit: "sigil_examined",
          when: "inspect_sigil",
          whenAll: [],
        },
      ],
      views: {
        entry: {
          text: "The inscriptions seem almost familiar.",
        },
      },
    },
  ]);
  assert.deepEqual(loader.getDiagnostics(), {
    documentCount: 1,
    enabled: true,
    loaderFlag: "engine.content.firstPassDsl",
    requiredFlags: ["content.arc.mirrorDistrict", "engine.projection.journalMap"],
    schemaVersion: 1,
  });
});

test("snapshots and restores content loader state", () => {
  const original = createContentLoader({
    capabilities: enabledCapabilities,
    documents: [authoredDocument()],
  });
  const restored = createContentLoader({
    capabilities: enabledCapabilities,
    state: original.snapshot(),
  });

  assert.deepEqual(restored.snapshot(), original.snapshot());
  assert.equal(restored.getDocument("archive.room.014")?.views.entry.text, "The inscriptions seem almost familiar.");
});

test("rejects unsafe player-facing text before content is loaded", () => {
  const loader = createContentLoader({ capabilities: enabledCapabilities });
  const document = authoredDocument();
  document.views.entry.text = "<script>alert(1)</script>";

  assert.throws(
    () => loader.loadDocuments([document]),
    /view entry text must be bounded plain text without markup characters/u,
  );
  assert.deepEqual(loader.getDocuments(), []);
});

test("rejects duplicate documents and invalid policy shapes", () => {
  const loader = createContentLoader({ capabilities: enabledCapabilities });
  assert.throws(
    () => loader.loadDocuments([authoredDocument(), authoredDocument()]),
    /duplicate content document id archive\.room\.014/u,
  );

  const invalidPolicy = authoredDocument();
  invalidPolicy.policies = [
    { when: "inspect_sigil", when_all: ["lever_a_pulled"], emit: "bad_event" },
  ];
  assert.throws(
    () => loader.loadDocuments([invalidPolicy]),
    /policy 0 must define exactly one of when or when_all/u,
  );
});

test("degrades to inert content when the loader flag is disabled", () => {
  const loader = createContentLoader({
    capabilities: disabledCapabilities,
    documents: [authoredDocument()],
  });

  assert.deepEqual(loader.getDocuments(), []);
  assert.equal(loader.getDocument("archive.room.014"), null);
  assert.deepEqual(loader.snapshot(), {
    documents: [],
    enabled: false,
    schemaVersion: 1,
  });
});
