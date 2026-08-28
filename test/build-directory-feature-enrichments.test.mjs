import test from "node:test";
import assert from "node:assert/strict";
import { publicationMapping } from "../scripts/build-directory-feature-enrichments.mjs";

test("reviewed view variants consolidate under the familiar directory label", () => {
  assert.equal(publicationMapping({ status: "candidate-new-feature", label: "Panoramic Bay Views" }), "Bay Views");
});

test("generic open-space classification is not published as an amenity", () => {
  assert.equal(publicationMapping({ status: "candidate-new-feature", label: "Open Space" }), null);
});

test("accessibility and operational values cannot enter feature publication", () => {
  assert.equal(publicationMapping({ status: "separate-accessibility-review", label: "Accessible Parking" }), null);
  assert.equal(publicationMapping({ status: "exclude-operational", label: "Available for Rentals" }), null);
});
