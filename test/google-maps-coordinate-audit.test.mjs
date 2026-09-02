import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { googleMapsDirectionsUrl, googleMapsEmbedUrl, googleMapsSearchUrl } from "../src/lib/maps.js";
import { distanceMiles } from "../src/lib/nearby-destinations.js";
import { isUsableMapPoint } from "../src/lib/results-map.js";

const destinations = JSON.parse(await readFile(new URL("../data/presentation/generated/destinations.json", import.meta.url), "utf8")).records;
const properties = new Map(JSON.parse(await readFile(new URL("../data/normalized/properties.json", import.meta.url), "utf8")).records.map((record) => [record.id, record]));
const facilities = new Map(JSON.parse(await readFile(new URL("../data/normalized/facilities.json", import.meta.url), "utf8")).records.map((record) => [record.id, record]));

function pointFromUrl(url, parameter) {
  const value = new URL(url).searchParams.get(parameter);
  assert.ok(value, `${url} is missing ${parameter}.`);
  const [latitude, longitude] = value.split(",").map(Number);
  return { latitude, longitude };
}

test("every Google Maps action uses the same source-backed point as the core map", () => {
  assert.equal(destinations.length, 249);
  assert.equal(destinations.filter((destination) => destination.displayPoint && isUsableMapPoint(destination.displayPoint)).length, 249);

  for (const destination of destinations) {
    const sourcePoints = [
      ...destination.propertyIds.map((id) => properties.get(id)?.displayPoint),
      ...destination.principalFacilityIds.map((id) => facilities.get(id)?.displayPoint),
    ].filter((point) => point && isUsableMapPoint(point));
    if (!destination.displayPoint || !isUsableMapPoint(destination.displayPoint)) {
      assert.equal(sourcePoints.length, 0, `${destination.id} withholds a usable source point.`);
      continue;
    }
    assert.ok(sourcePoints.length > 0, `${destination.id} has no source coordinate for comparison.`);
    assert.ok(
      Math.min(...sourcePoints.map((point) => distanceMiles(destination.displayPoint, point))) <= 0.05,
      `${destination.id} is more than 0.05 mile from every associated source point.`,
    );

    const googlePoints = [
      pointFromUrl(googleMapsSearchUrl(destination.displayPoint.latitude, destination.displayPoint.longitude), "query"),
      pointFromUrl(googleMapsDirectionsUrl(destination.displayPoint.latitude, destination.displayPoint.longitude), "destination"),
      pointFromUrl(googleMapsEmbedUrl("audit-key", destination.displayPoint.latitude, destination.displayPoint.longitude), "q"),
    ];
    for (const googlePoint of googlePoints) {
      assert.ok(
        distanceMiles(destination.displayPoint, googlePoint) <= 0.001,
        `${destination.id} has a Google Maps coordinate that differs from its core map point.`,
      );
    }
  }
});
