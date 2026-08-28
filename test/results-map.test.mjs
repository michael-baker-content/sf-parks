import test from "node:test";
import assert from "node:assert/strict";
import { initialViewportDestinations, isUsableMapPoint } from "../src/lib/results-map.js";

test("map points reject null-island placeholders", () => {
  assert.equal(isUsableMapPoint({ latitude: 0, longitude: 0 }), false);
  assert.equal(isUsableMapPoint({ latitude: 37.76, longitude: -122.44 }), true);
});

test("the untouched all-results viewport stays focused on San Francisco proper", () => {
  const destinations = [
    { id: "sf", latitude: 37.76, longitude: -122.44 },
    { id: "sharp", latitude: 37.63, longitude: -122.49 },
    { id: "camp", latitude: 37.88, longitude: -119.85 },
    { id: "placeholder", latitude: 0, longitude: 0 }
  ];
  assert.deepEqual(initialViewportDestinations(destinations, { preferCoreCity: true }).map(({ id }) => id), ["sf"]);
});

test("search results can expand to Sharp Park and Camp Mather", () => {
  const destinations = [
    { id: "sharp", latitude: 37.63, longitude: -122.49 },
    { id: "camp", latitude: 37.88, longitude: -119.85 }
  ];
  assert.deepEqual(initialViewportDestinations(destinations).map(({ id }) => id), ["sharp", "camp"]);
});
