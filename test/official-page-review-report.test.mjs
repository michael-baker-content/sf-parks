import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { buildOfficialPageReviewReport } from "../scripts/build-official-page-review-report.mjs";

const readJson = (path) => readFile(new URL(path, import.meta.url), "utf8").then(JSON.parse);
const [destinations, evergreen, deferred, noOfficialPages, secondPassReviews, directoryFeatures] = await Promise.all([
  readJson("../data/presentation/generated/destinations.json"),
  readJson("../data/content/evergreen-content.json"),
  readJson("../data/content/evergreen-deferred.json"),
  readJson("../data/content/official-page-no-match.json"),
  readJson("../data/content/official-page-second-pass.json"),
  readJson("../data/presentation/directory-features.json")
]);
const report = buildOfficialPageReviewReport({ destinations, evergreen, deferred, noOfficialPages, secondPassReviews, directoryFeatures });

test("official-page review report classifies every destination exactly once", () => {
  assert.equal(report.records.length, destinations.records.length);
  assert.equal(new Set(report.records.map((record) => record.destinationId)).size, destinations.records.length);
  assert.equal(Object.values(report.summary).reduce((sum, count) => sum + count, 0), destinations.records.length);
});

test("published enrichment takes precedence over a deferred record", () => {
  const enrichedIds = new Set([
    ...evergreen.records.map((record) => record.destinationId),
    ...directoryFeatures.records.map((record) => record.destinationId)
  ]);
  for (const record of report.records.filter((item) => enrichedIds.has(item.destinationId))) {
    assert.equal(record.status, "reviewed-and-enriched");
  }
});

test("uncompleted deferred work remains pending", () => {
  const pendingDeferredIds = deferred.records
    .filter((record) => /review the official detail page/i.test(record.nextStep ?? ""))
    .map((record) => record.destinationId);
  for (const id of pendingDeferredIds) {
    const record = report.records.find((item) => item.destinationId === id);
    if (!record.evidence.length) assert.equal(record.status, "pending-review");
  }
});

test("documented official-page searches close the review without implying enrichment", () => {
  for (const { destinationId } of noOfficialPages.records) {
    const record = report.records.find((item) => item.destinationId === destinationId);
    assert.equal(record.status, "no-official-page");
    assert.deepEqual(record.evidence, ["documented-no-official-page"]);
  }
});

test("every legacy no-additions outcome has an expanded official-source review", () => {
  const secondPassIds = new Set(secondPassReviews.records.map((record) => record.destinationId));
  for (const record of report.records.filter((item) => item.status === "reviewed-no-additions")) {
    assert.equal(secondPassIds.has(record.destinationId), true, `${record.destinationId} lacks a second-pass review`);
    assert.equal(record.evidence.includes("expanded-official-search"), true);
  }
});
