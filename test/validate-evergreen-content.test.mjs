import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateEvergreenContent } from "../scripts/validate-evergreen-content.mjs";

const registry = JSON.parse(await readFile(new URL("../data/content/evergreen-content.json", import.meta.url), "utf8"));

const validRecord = {
  destinationId: "example-park",
  overview: { text: "A wooded neighborhood park on a steep hillside.", sourceRefs: ["official"] },
  highlights: [{
    label: "Hilltop setting",
    description: "Paths cross a wooded slope above the surrounding neighborhood.",
    category: "landscape",
    sourceRefs: ["official"]
  }],
  physicalFacts: [{ label: "Terrain", value: "Steep hillside", category: "terrain", sourceRefs: ["official"] }],
  sources: [{ id: "official", title: "Example Park", url: "https://www.sfrecpark.org/example", retrievedAt: "2026-08-27" }],
  review: { status: "approved", reviewedAt: "2026-08-27", reviewedBy: "project-owner", notes: "Facts checked against the cited page." }
};

test("the committed evergreen registry contains only reviewed content", () => {
  assert.deepEqual(validateEvergreenContent(registry), []);
});

test("durable descriptions and physical facts are accepted", () => {
  const document = { schemaVersion: 1, reviewPolicy: "docs/policy.md", records: [validRecord] };
  assert.deepEqual(validateEvergreenContent(document), []);
});

test("operational categories cannot enter the evergreen layer", () => {
  const invalid = structuredClone(validRecord);
  invalid.physicalFacts.push({ label: "Hours", value: "Open daily", category: "hours", sourceRefs: ["official"] });
  const errors = validateEvergreenContent({ schemaVersion: 1, reviewPolicy: "docs/policy.md", records: [invalid] });
  assert.ok(errors.some((item) => item.includes("category is not evergreen")));
});

test("every published statement must cite a known source", () => {
  const invalid = structuredClone(validRecord);
  invalid.overview.sourceRefs = ["missing"];
  const errors = validateEvergreenContent({ schemaVersion: 1, reviewPolicy: "docs/policy.md", records: [invalid] });
  assert.ok(errors.some((item) => item.includes("unknown sourceRef")));
});
