import test from "node:test";
import assert from "node:assert/strict";
import { classifyFeature } from "../scripts/audit-facility-features.mjs";

test("directory synonyms map to existing public labels", () => {
  assert.deepEqual(classifyFeature("BBQ Grills"), { status: "existing-equivalent", mapsTo: "Grill" });
});

test("temporary and operational features cannot become amenities", () => {
  assert.equal(classifyFeature("Playground (Under Renovation)").status, "exclude-temporary");
  assert.equal(classifyFeature("Available for Rentals").status, "exclude-operational");
});

test("accessibility claims enter a separate review path", () => {
  assert.equal(classifyFeature("Accessible Parking").status, "separate-accessibility-review");
});

test("unmapped durable features become review candidates", () => {
  assert.equal(classifyFeature("Boat Launch").status, "candidate-new-feature");
});
