import test from "node:test";
import assert from "node:assert/strict";
import { selectFeaturedParks } from "../src/lib/featured-parks.js";

test("featured park selection returns distinct records without changing the pool", () => {
  const parks = ["a", "b", "c", "d", "e", "f"];
  const selected = selectFeaturedParks(parks, 4, () => 0.25);
  assert.equal(selected.length, 4);
  assert.equal(new Set(selected).size, 4);
  assert.deepEqual(parks, ["a", "b", "c", "d", "e", "f"]);
});

test("featured park selection never requests more records than are available", () => {
  assert.equal(selectFeaturedParks(["a", "b"], 4, () => 0.5).length, 2);
});
