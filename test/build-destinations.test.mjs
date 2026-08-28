import assert from "node:assert/strict";
import test from "node:test";
import { buildDestinations, collapseAmenities } from "../scripts/build-destinations.mjs";

test("amenity evidence collapses familiar aliases without inventing a quantity", () => {
  const result = collapseAmenities([
    { sourceType: "Picnic Area", publicClassification: { category: "picnic", publicLabel: "Picnic Area" }, sourceReferences: [] },
    { sourceType: "Table Seating Area", publicClassification: { category: "picnic", publicLabel: "Table Seating Area" }, sourceReferences: [] }
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].label, "Picnic Area");
  assert.equal(result[0].quantity, null);
  assert.equal(result[0].evidenceCount, 2);
});

test("official enrichment may provide a verified quantity", () => {
  const result = collapseAmenities([], [{ label: "Tennis Court", category: "sports", quantity: 6 }]);
  assert.equal(result[0].quantity, 6);
  assert.equal(result[0].quantityStatus, "official-page-verified");
});

test("a configured virtual destination hides member properties but keeps aliases", () => {
  const properties = [
    { id: "1", name: "Park - Section 1", address: "A", displayPoint: null },
    { id: "2", name: "Park - Section 2", address: "A", displayPoint: null }
  ];
  const records = buildDestinations({
    properties,
    facilities: [],
    amenities: { facilities: [], functionalAreas: [], assetSummaries: [] },
    configuration: { destinations: [{
      id: "park", publicName: "Park", kind: "virtual-property", propertyIds: ["1", "2"],
      principalFacilityIds: [], hiddenSourceAliases: ["Park - Section 1", "Park - Section 2"],
      reason: "Public grouping", reviewedAt: "2026-08-26", reviewedBy: "owner", sourceUrl: "https://example.test"
    }] },
    enrichments: { enrichments: [] }
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].publicName, "Park");
  assert.ok(records[0].searchableAliases.includes("Park - Section 2"));
  assert.equal(records[0].subplaces.length, 2);
  assert.equal(records[0].presentationReview.reason, "Public grouping");
  assert.deepEqual(records[0].officialActions, [{ type: "information-page", url: "https://example.test", reviewedAt: "2026-08-26", retrievedAt: null }]);
});

test("original amenity terminology remains searchable after labels collapse", () => {
  const properties = [{ id: "1", name: "Park", address: "A", displayPoint: null }];
  const records = buildDestinations({
    properties,
    facilities: [],
    amenities: {
      facilities: [],
      functionalAreas: [{
        id: "FA1", property: { id: "1" }, facility: { id: null }, sourceType: "Table Seating Area",
        publicClassification: { category: "picnic", publicLabel: "Table Seating Area" }, sourceReferences: []
      }],
      assetSummaries: []
    },
    configuration: { destinations: [] },
    enrichments: { enrichments: [] }
  });
  assert.ok(records[0].searchableAmenityTerms.includes("Picnic Area"));
  assert.ok(records[0].searchableAmenityTerms.includes("Table Seating Area"));
});
