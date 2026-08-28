import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const destinations = JSON.parse(await readFile(new URL("../data/presentation/generated/destinations.json", import.meta.url), "utf8")).records;
const manifest = JSON.parse(await readFile(new URL("../data/media/media-manifest.json", import.meta.url), "utf8"));
const report = JSON.parse(await readFile(new URL("../data/media/generated/image-coverage-report.json", import.meta.url), "utf8"));

test("image coverage reports every destination exactly once", () => {
  assert.equal(report.records.length, destinations.length);
  assert.equal(new Set(report.records.map((record) => record.destinationId)).size, destinations.length);
  assert.equal(report.sourceRecordCount, destinations.length);
});

test("image coverage summary agrees with the approved media manifest", () => {
  const publishedDestinations = new Set(manifest.images.map((image) => image.destinationId));
  assert.equal(report.summary.placeholderOnly, destinations.length - publishedDestinations.size);
  assert.equal(report.summary.placeholderOnly + report.summary.oneApprovedImage + report.summary.multipleApprovedImages, destinations.length);
});

test("placeholder records use the generic asset and carry a photography checklist", () => {
  for (const record of report.records.filter((item) => item.coverageStatus === "placeholder-only")) {
    assert.equal(record.leadImagePath, "/media/park-image-placeholder.png");
    assert.ok(record.shotSuggestions.length >= 2);
  }
});
