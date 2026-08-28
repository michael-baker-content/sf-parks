import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateMediaManifest } from "../scripts/validate-media-manifest.mjs";

const manifest = JSON.parse(await readFile(new URL("../data/media/media-manifest.json", import.meta.url), "utf8"));

test("the committed media manifest contains only reviewed images", () => {
  assert.deepEqual(validateMediaManifest(manifest), []);
  assert.equal(manifest.images.length, 15);
});

test("published media requires attribution and an approved reusable license", () => {
  const invalid = structuredClone(manifest);
  invalid.images.push({ destinationId: "example", position: 1, wikidataEntityId: "Q1", licenseId: "unknown" });
  const errors = validateMediaManifest(invalid);
  assert.ok(errors.some((item) => item.includes("attribution")));
  assert.ok(errors.some((item) => item.includes("license")));
});

test("LocalWiki media remains bound to reviewed LocalWiki source records", () => {
  const localwikiImage = manifest.images.find((image) => image.sourceType === "localwiki");
  assert.ok(localwikiImage);
  const invalid = structuredClone(manifest);
  const target = invalid.images.find((image) => image.sourceType === "localwiki");
  target.imageUrl = "https://upload.wikimedia.org/example.jpg";
  assert.ok(validateMediaManifest(invalid).some((item) => item.includes("served by LocalWiki")));
});
