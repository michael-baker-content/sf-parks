import assert from "node:assert/strict";
import test from "node:test";
import { chooseCanonical, fieldConflicts, groupById, isUsableCoordinatePair, normalizeDatasets } from "../scripts/normalize.mjs";

test("canonical selection prefers the most familiar repeated source value", () => {
  const rows = [{ name: "Rec Center" }, { name: "Rec Center" }, { name: "Recreation Facility" }];
  assert.equal(chooseCanonical(rows, "name"), "Rec Center");
  assert.deepEqual(fieldConflicts(rows, ["name"]), { name: ["Rec Center", "Recreation Facility"] });
});

test("grouping preserves every repeated source row", () => {
  const groups = groupById([{ id: "A" }, { id: "A" }, { id: "B" }], "id");
  assert.equal(groups.length, 2);
  assert.equal(groups[0][1].length, 2);
});

test("normalization does not invent a missing relationship", () => {
  const result = normalizeDatasets({
    properties: [{ data: { objectid: "1", property_id: "P1", property_name: "Park" } }],
    facilities: [{ data: { objectid: "2", facility_id: "F1", facility_name: "Court", property_id: "UNKNOWN", facility_type: "Basketball Court" } }],
    functionalAreas: [],
    assets: [],
    taxonomy: {
      facilityTypes: { "Basketball Court": { category: "sports", publicLabel: "Basketball Court" } },
      functionalAreaTypes: {},
      assetTypes: {}
    }
  });
  assert.equal(result.facilities[0].property.status, "unresolved");
  assert.equal(result.facilities[0].publicClassification.publicLabel, "Basketball Court");
  assert.deepEqual(result.report.unresolvedRelationships.facilitiesWithoutProperty, ["F1"]);
});

test("normalization output is deterministic for identical inputs", () => {
  const input = {
    properties: [{ data: { objectid: "1", property_id: "P1", property_name: "Park" } }],
    facilities: [],
    functionalAreas: [],
    assets: [],
    taxonomy: { facilityTypes: {}, functionalAreaTypes: {}, assetTypes: {} }
  };
  assert.deepEqual(normalizeDatasets(input), normalizeDatasets(input));
});

test("property normalization preserves source area and derives square feet only as a fallback", () => {
  const base = { facilities: [], functionalAreas: [], assets: [], taxonomy: { facilityTypes: {}, functionalAreaTypes: {}, assetTypes: {} } };
  const sourced = normalizeDatasets({ ...base, properties: [{ data: { objectid: "1", property_id: "P1", property_name: "Park", acres: "2", squarefeet: "90000" } }] });
  const derived = normalizeDatasets({ ...base, properties: [{ data: { objectid: "2", property_id: "P2", property_name: "Park 2", acres: "2" } }] });
  assert.equal(sourced.properties[0].squareFeet, 90000);
  assert.equal(derived.properties[0].squareFeet, 87120);
});

test("normalization rejects null-island coordinates before they reach public maps", () => {
  assert.equal(isUsableCoordinatePair("0", "0"), false);
  assert.equal(isUsableCoordinatePair("37.823", "-122.371"), true);
  const result = normalizeDatasets({
    properties: [{ data: { objectid: "1", property_id: "P1", property_name: "Park", latitude: "0", longitude: "0" } }],
    facilities: [], functionalAreas: [], assets: [],
    taxonomy: { facilityTypes: {}, functionalAreaTypes: {}, assetTypes: {} },
  });
  assert.equal(result.properties[0].displayPoint, null);
});

test("normalization replaces a source point outside its official geometry", () => {
  const shape = { type: "Polygon", coordinates: [[[-122.37, 37.80], [-122.36, 37.80], [-122.36, 37.81], [-122.37, 37.81], [-122.37, 37.80]]] };
  const result = normalizeDatasets({
    properties: [{ data: { objectid: "1", property_id: "P1", property_name: "Island Park", latitude: "37.71", longitude: "-122.41", shape } }],
    facilities: [], functionalAreas: [], assets: [],
    taxonomy: { facilityTypes: {}, functionalAreaTypes: {}, assetTypes: {} },
  });
  assert.equal(result.properties[0].displayPoint.precision, "derived-shape-point");
  assert.equal(result.properties[0].coordinateReview.reason, "source-point-outside-shape");
  assert.equal(result.report.coordinateCorrections.properties.length, 1);
});

test("normalization retains a reasonable source label point near a complex boundary", () => {
  const shape = { type: "Polygon", coordinates: [[[-122.37, 37.80], [-122.36, 37.80], [-122.36, 37.81], [-122.37, 37.81], [-122.37, 37.80]]] };
  const result = normalizeDatasets({
    properties: [{ data: { objectid: "1", property_id: "P1", property_name: "Boundary Park", latitude: "37.805", longitude: "-122.3705", shape } }],
    facilities: [], functionalAreas: [], assets: [],
    taxonomy: { facilityTypes: {}, functionalAreaTypes: {}, assetTypes: {} },
  });
  assert.equal(result.properties[0].displayPoint.precision, "source-point");
  assert.equal(result.properties[0].coordinateReview, undefined);
});
