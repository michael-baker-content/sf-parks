import assert from "node:assert/strict";
import test from "node:test";
import { parseCsvLine, transitMode } from "../scripts/normalize-transit.mjs";

test("GTFS CSV parsing preserves quoted commas and escaped quotes", () => {
  assert.deepEqual(parseCsvLine('SF:1,"Market, Main","Say ""hello"""'), [
    "SF:1", "Market, Main", 'Say "hello"'
  ]);
});

test("supported operators receive familiar public transit labels", () => {
  assert.equal(transitMode("SF", "3"), "bus");
  assert.equal(transitMode("SF", "0"), "muni-rail");
  assert.equal(transitMode("SF", "5"), "cable-car");
  assert.equal(transitMode("BA", "1"), "bart");
  assert.equal(transitMode("CT", "2"), "caltrain");
});
