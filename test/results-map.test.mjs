import test from "node:test";
import assert from "node:assert/strict";
import { closestMapFeature, initialViewportDestinations, isMajorMapDestination, isUsableMapPoint } from "../src/lib/results-map.js";

test("map points reject null-island placeholders", () => {
  assert.equal(isUsableMapPoint({ latitude: 0, longitude: 0 }), false);
  assert.equal(isUsableMapPoint({ latitude: 37.76, longitude: -122.44 }), true);
});

test("major map markers use the documented amenity threshold", () => {
  assert.equal(isMajorMapDestination({ amenityCount: 9 }), false);
  assert.equal(isMajorMapDestination({ amenityCount: 10 }), true);
});

test("overlapping marker hits select the center nearest the pointer", () => {
  const features = [
    { properties: { name: "First" }, geometry: { type: "Point", coordinates: [10, 10] } },
    { properties: { name: "Second" }, geometry: { type: "Point", coordinates: [14, 10] } }
  ];
  const selected = closestMapFeature(features, { x: 13, y: 10 }, ([x, y]) => ({ x, y }));
  assert.equal(selected.properties.name, "Second");
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
