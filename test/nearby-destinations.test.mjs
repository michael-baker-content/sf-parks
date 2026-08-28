import assert from "node:assert/strict";
import test from "node:test";
import { distanceMiles, nearbyDestinations } from "../src/lib/nearby-destinations.js";

const destinations = [
  { id: "origin", publicName: "Origin Park", displayPoint: { latitude: 37.8, longitude: -122.4 }, placeTypes: ["Neighborhood Park or Playground"] },
  { id: "close", publicName: "Close Park", displayPoint: { latitude: 37.801, longitude: -122.4 }, placeTypes: ["Mini Park"] },
  { id: "far", publicName: "Far Park", displayPoint: { latitude: 37.85, longitude: -122.4 }, placeTypes: ["Regional Park"] },
  { id: "library", publicName: "Library", displayPoint: { latitude: 37.8005, longitude: -122.4 }, placeTypes: ["Library"] },
  { id: "missing", publicName: "No Coordinates", displayPoint: null, placeTypes: ["Mini Park"] }
];

test("distance calculation is symmetric and zero at the same point", () => {
  const a = { latitude: 37.8, longitude: -122.4 };
  const b = { latitude: 37.81, longitude: -122.41 };
  assert.equal(distanceMiles(a, a), 0);
  assert.ok(Math.abs(distanceMiles(a, b) - distanceMiles(b, a)) < 1e-9);
});

test("nearby destinations are ordered, bounded, and limited to park-facing records", () => {
  const results = nearbyDestinations(destinations, "origin", { limit: 4, maxDistanceMiles: 1 });
  assert.deepEqual(results.map((result) => result.destination.id), ["close"]);
});

test("destinations without coordinates have no nearby recommendations", () => {
  assert.deepEqual(nearbyDestinations(destinations, "missing"), []);
});
