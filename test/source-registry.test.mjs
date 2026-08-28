import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const registry = JSON.parse(
  await readFile(new URL("../data/sources.json", import.meta.url), "utf8")
);

test("every approved source carries minimum provenance and permission data", () => {
  const approved = registry.sources.filter((source) => source.review.status === "approved");
  assert.ok(approved.length > 0, "expected at least one approved source");

  for (const source of approved) {
    assert.ok(source.sourceUrl);
    assert.ok(source.termsUrl);
    assert.ok(source.license?.id);
    assert.ok(source.license?.url);
    assert.ok(source.review.reviewedAt);
    assert.ok(source.review.reviewedBy);
    assert.equal(source.containsPersonLevelData, false);
    assert.ok(source.permittedUses.includes("ingest"));
    assert.ok(source.permittedUses.includes("display"));
  }
});

test("unreviewed sources are blocked from ingestion", () => {
  for (const source of registry.sources.filter((item) => item.review.status !== "approved")) {
    assert.ok(!source.permittedUses.includes("ingest"));
  }
});

test("source identifiers are unique", () => {
  const ids = registry.sources.map((source) => source.id);
  assert.equal(new Set(ids).size, ids.length);
});

