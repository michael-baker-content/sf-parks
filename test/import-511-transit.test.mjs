import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildFeedUrl, importRegionalGtfs } from "../scripts/import-511-transit.mjs";

test("511 feed URL requires a private API key", () => {
  assert.throws(() => buildFeedUrl(""), /511_API_KEY is required/);
  const url = buildFeedUrl("secret-token");
  assert.equal(url.searchParams.get("operator_id"), "RG");
  assert.equal(url.searchParams.get("api_key"), "secret-token");
});

test("511 import writes an archive and token-free provenance", async (t) => {
  const outputDirectory = new URL(`../.tmp-test-${process.pid}-${Date.now()}/`, import.meta.url);
  t.after(async () => {
    const { rm } = await import("node:fs/promises");
    await rm(outputDirectory, { recursive: true, force: true });
  });

  const fetchImpl = async (url) => {
    assert.equal(url.searchParams.get("api_key"), "secret-token");
    return new Response(Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]));
  };
  const result = await importRegionalGtfs({
    apiKey: "secret-token",
    fetchImpl,
    outputDirectory,
    now: () => new Date("2026-08-27T12:00:00.000Z")
  });
  const metadata = await readFile(result.metadataUrl, "utf8");
  assert.doesNotMatch(metadata, /secret-token/);
  assert.match(metadata, /511-regional-gtfs/);
});
