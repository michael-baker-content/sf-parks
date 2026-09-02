import assert from "node:assert/strict";
import test from "node:test";
import { geometryContainsPoint, representativeGeometryPoint } from "../src/lib/geojson-points.js";

const square = { type: "Polygon", coordinates: [[[-122.4, 37.7], [-122.3, 37.7], [-122.3, 37.8], [-122.4, 37.8], [-122.4, 37.7]]] };

test("geometry containment distinguishes an internal point from a distant source error", () => {
  assert.equal(geometryContainsPoint(square, { longitude: -122.35, latitude: 37.75 }), true);
  assert.equal(geometryContainsPoint(square, { longitude: -122.45, latitude: 37.75 }), false);
});

test("representative geometry points remain inside the reviewed shape", () => {
  const point = representativeGeometryPoint(square);
  assert.ok(point);
  assert.equal(geometryContainsPoint(square, point), true);
});
