import assert from "node:assert/strict";
import test from "node:test";
import { chooseCanonical, fieldConflicts, groupById, normalizeDatasets } from "../scripts/normalize.mjs";

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
