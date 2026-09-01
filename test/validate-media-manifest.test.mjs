import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateMediaManifest } from "../scripts/validate-media-manifest.mjs";

const manifest = JSON.parse(await readFile(new URL("../data/media/media-manifest.json", import.meta.url), "utf8"));
const blobAssets = JSON.parse(await readFile(new URL("../data/media/blob-assets.json", import.meta.url), "utf8"));

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

test("published Blob delivery records use responsive immutable image URLs", () => {
  assert.equal(blobAssets.provider, "vercel-blob");
  assert.equal(new Set(blobAssets.assets.map((asset) => asset.localPath)).size, blobAssets.assets.length);
  for (const asset of blobAssets.assets) {
    assert.match(asset.localPath, /^\/media\/[a-z0-9-]+\.(?:jpg|png|webp)$/);
    assert.ok(asset.variants.length > 0);
    for (const variant of asset.variants) {
      const url = new URL(variant.url);
      assert.equal(url.protocol, "https:");
      assert.match(url.hostname, /\.public\.blob\.vercel-storage\.com$/);
      assert.match(variant.pathname, /^media\/[a-z0-9-]+\/[a-f0-9]{12}\/\d+\.webp$/);
      assert.ok(variant.width > 0 && variant.height > 0 && variant.bytes > 0);
    }
  }
});

test("every site image is backed by the committed Blob registry", () => {
  const deliveredPaths = new Set(blobAssets.assets.map((asset) => asset.localPath));
  const siteImagePaths = new Set([
    ...manifest.images.map((image) => image.localPath),
    "/media/park-image-placeholder.png",
    "/media/programs-pickleball-watercolor.jpg",
    "/media/programs-youth-gardening-watercolor.jpg",
  ]);
  assert.deepEqual([...siteImagePaths].filter((path) => !deliveredPaths.has(path)), []);
});
