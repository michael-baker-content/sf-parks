import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { activityMatches, areaMatches, buildSearchIndex, normalizeSearchText } from "../scripts/build-search-index.mjs";

test("search text normalization is case, punctuation, and accent insensitive", () => {
  assert.equal(normalizeSearchText("José's Park & Pool"), "jose s park and pool");
});

test("activity presets transparently match configured amenities", () => {
  const destination = { amenities: [{ label: "Dog Play Area", category: "dogs" }] };
  assert.equal(activityMatches(destination, { match: "any", amenityLabels: ["Dog Play Area"] }), true);
  assert.equal(activityMatches(destination, { match: "any", categories: ["swimming"] }), false);
});

test("area groups match reviewed neighborhoods and explicit outlying destinations", () => {
  assert.equal(areaMatches({ id: "park" }, { neighborhoodLabels: ["Mission"] }, ["Mission"]), true);
  assert.equal(areaMatches({ id: "camp-mather" }, { destinationIds: ["camp-mather"] }, []), true);
  assert.equal(areaMatches({ id: "park" }, { neighborhoodLabels: ["Mission"] }, ["Sunset/Parkside"]), false);
});

test("search index preserves aliases and creates filter facets", () => {
  const destination = {
    id: "park", publicName: "Golden Gate Park", searchableAliases: ["Golden Gate Park - Section 4"],
    searchableAmenityTerms: ["Children's Play Area"], neighborhood: "Golden Gate Park",
    address: "501 Stanyan St", zipcode: "94117", placeTypes: ["Regional Park"],
    coverage: "open-data-only", acres: 10, squareFeet: 435600, displayPoint: null,
    amenities: [{ label: "Children's Play Area", category: "playgrounds" }]
  };
  const configuration = {
    activities: [{ id: "play-with-kids", label: "Play with kids", match: "any", amenityLabels: ["Children's Play Area"] }],
    areas: [{ id: "sunset-westside", label: "Sunset & Westside", neighborhoodLabels: ["Golden Gate Park"] }]
  };
  const index = buildSearchIndex([destination], configuration);
  assert.equal(index.records[0].normalized.aliases[0], "golden gate park section 4");
  assert.deepEqual(index.records[0].filters.activityIds, ["play-with-kids"]);
  assert.equal(index.facets.activities[0].count, 1);
  assert.deepEqual(index.records[0].filters.areaIds, ["sunset-westside"]);
  assert.equal(index.facets.areas[0].count, 1);
  assert.equal(index.facets.placeTypes[0].label, "Regional Park");
  assert.deepEqual(index.facets.zipcodes[0], { id: "94117", label: "94117", count: 1 });
  assert.equal(index.records[0].display.squareFeet, 435600);
});

test("compound source neighborhoods become individual filter values", () => {
  const destination = {
    id: "park", publicName: "Park", searchableAliases: [], searchableAmenityTerms: [],
    neighborhood: "Mission, Bernal Heights", address: "A", zipcode: "94110",
    placeTypes: ["Mini Park"], coverage: "open-data-only", acres: 1, squareFeet: 43560, displayPoint: null, amenities: []
  };
  const index = buildSearchIndex([destination], { activities: [] });
  assert.deepEqual(index.records[0].filters.neighborhoods, ["Bernal Heights", "Mission"]);
  assert.equal(index.facets.neighborhoods.length, 2);
});

test("the committed area model assigns every destination to exactly one area", () => {
  const destinations = JSON.parse(readFileSync(new URL("../data/presentation/generated/destinations.json", import.meta.url), "utf8")).records;
  const configuration = JSON.parse(readFileSync(new URL("../data/search/search-filters.json", import.meta.url), "utf8"));
  const index = buildSearchIndex(destinations, configuration);
  assert.equal(configuration.areas.length, 9);
  assert.deepEqual(index.records.filter((record) => record.filters.areaIds.length !== 1), []);
});
