import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { MAX_SOURCE_SHAPE_DISTANCE_MILES } from "../scripts/normalize.mjs";
import { geometryContainsPoint, representativeGeometryPoint } from "../src/lib/geojson-points.js";
import { distanceMiles } from "../src/lib/nearby-destinations.js";

const imported = JSON.parse(await readFile(new URL("../data/imports/datasf-rec-park-properties.json", import.meta.url), "utf8")).records;
const normalized = new Map(JSON.parse(await readFile(new URL("../data/normalized/properties.json", import.meta.url), "utf8")).records.map((record) => [record.id, record]));

test("every property point is inside or reasonably near its official geometry", () => {
  for (const { data } of imported) {
    const property = normalized.get(data.property_id);
    if (!property?.displayPoint || !data.shape) continue;
    if (geometryContainsPoint(data.shape, property.displayPoint)) continue;
    const representative = representativeGeometryPoint(data.shape);
    assert.ok(representative, `${property.id} has geometry without a representative point.`);
    assert.ok(
      distanceMiles(property.displayPoint, representative) <= MAX_SOURCE_SHAPE_DISTANCE_MILES,
      `${property.id} is unreasonably distant from its official geometry.`,
    );
  }
});

test("known island source conflicts use geometry-derived points", () => {
  for (const id of ["957481", "957482", "957483"]) {
    const property = normalized.get(id);
    assert.equal(property.displayPoint.precision, "derived-shape-point");
    assert.ok(property.coordinateReview);
  }
});
