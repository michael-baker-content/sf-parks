import assert from "node:assert/strict";
import test from "node:test";
import { explainFilterMatch, explainMatch, explainQueryMatch, filterAndRank, normalizeSearchText, scoreRecord } from "../src/lib/search.js";
import { readState, stateUrl } from "../src/lib/url-state.js";
import { resultFocusId, resultReturnPath } from "../src/lib/result-focus.js";
import { googleMapsDirectionsUrl, googleMapsEmbedUrl, googleMapsSearchUrl } from "../src/lib/maps.js";
import { searchUrl } from "../src/lib/search-url.js";
import { RESULTS_PAGE_SIZE } from "../src/lib/pagination.js";

const record = {
  publicName: "Golden Gate Park",
  normalized: {
    publicName: "golden gate park",
    aliases: ["golden gate park section 4"],
    amenityTerms: ["tennis court"], neighborhood: "golden gate park",
    zipcode: "94117", address: "501 stanyan st",
    combined: "golden gate park section 4 tennis court 94117 501 stanyan st"
  },
  filters: {
    activityIds: ["play-sports"], amenityIds: ["tennis-court"],
    amenityLabels: ["Tennis Court"],
    areaIds: ["sunset-westside"],
    neighborhoodIds: ["golden-gate-park"], placeTypeIds: ["regional-park"],
    zipcode: "94117", coverage: "open-data-only"
  },
  display: { acres: 10, squareFeet: 435600 }
};

test("Explore reveals results in manageable groups", () => {
  assert.equal(RESULTS_PAGE_SIZE, 15);
});

test("URL state preserves repeatable filters", () => {
  const state = readState("?q=tennis&activity=play-sports&amenity=restrooms&amenity=tennis-court&area=sunset-westside&zip=94117&minAmenities=5&minAcres=1.5");
  assert.equal(state.q, "tennis");
  assert.deepEqual(state.amenity, ["restrooms", "tennis-court"]);
  assert.deepEqual(state.zip, ["94117"]);
  assert.deepEqual(state.area, ["sunset-westside"]);
  assert.equal(state.minAmenities, 5);
  assert.equal(state.minAcres, 1.5);
  assert.match(stateUrl(state, state), /amenity=restrooms/);
  assert.match(stateUrl(state, state), /zip=94117/);
  assert.match(stateUrl(state, state), /area=sunset-westside/);
  assert.match(stateUrl(state, state), /minAmenities=5/);
  assert.match(stateUrl(state, state), /minAcres=1.5/);
});

test("global search reuses the Explore query URL", () => {
  assert.equal(searchUrl("  tennis courts  "), "/explore/?q=tennis%20courts");
  assert.equal(searchUrl("   "), "/explore/");
});

test("ZIP filters match only destinations in a selected ZIP code", () => {
  const base = { q: "", activity: [], amenity: [], neighborhood: [], place: [], coverage: [], sort: "relevance" };
  assert.equal(filterAndRank([record], { ...base, zip: ["94117"] }).length, 1);
  assert.equal(filterAndRank([record], { ...base, zip: ["94110"] }).length, 0);
});

test("area filters match the reviewed area grouping", () => {
  const base = { q: "", activity: [], amenity: [], area: ["sunset-westside"], neighborhood: [], zip: [], place: [], coverage: [], sort: "relevance" };
  assert.equal(filterAndRank([record], base).length, 1);
  assert.equal(filterAndRank([record], { ...base, area: ["southeast-san-francisco"] }).length, 0);
});

test("hidden source aliases rank as direct matches", () => {
  assert.equal(scoreRecord(record, "Golden Gate Park - Section 4"), 85);
});

test("combined amenity filters use AND logic", () => {
  const state = { q: "", activity: [], amenity: ["tennis-court", "restrooms"], neighborhood: [], place: [], coverage: [], sort: "relevance" };
  assert.equal(filterAndRank([record], state).length, 0);
  assert.equal(normalizeSearchText("José & Tennis"), "jose and tennis");
});

test("most amenities sorting uses names to break equal counts", () => {
  const base = { q: "", activity: [], amenity: [], neighborhood: [], zip: [], place: [], coverage: [], sort: "amenities" };
  const records = [
    { ...record, publicName: "Zulu Park", filters: { ...record.filters, amenityLabels: ["One"] } },
    { ...record, publicName: "Beta Park", filters: { ...record.filters, amenityLabels: ["One", "Two"] } },
    { ...record, publicName: "Alpha Park", filters: { ...record.filters, amenityLabels: ["One", "Two"] } }
  ];
  assert.deepEqual(filterAndRank(records, base).map(({ record: item }) => item.publicName), ["Alpha Park", "Beta Park", "Zulu Park"]);
});

test("minimum amenity and park-size thresholds require positive source evidence", () => {
  const base = { q: "", activity: [], amenity: [], neighborhood: [], zip: [], place: [], coverage: [], sort: "relevance" };
  assert.equal(filterAndRank([record], { ...base, minAmenities: 1, minAcres: 9 }).length, 1);
  assert.equal(filterAndRank([record], { ...base, minAmenities: 2 }).length, 0);
  assert.equal(filterAndRank([record], { ...base, minAcres: 11 }).length, 0);
  assert.equal(filterAndRank([{ ...record, display: { acres: null } }], { ...base, minAcres: 1 }).length, 0);
});

test("query explanations prefer understandable amenity labels", () => {
  assert.deepEqual(explainQueryMatch(record, "tennis"), { reason: "Tennis Court", amenityLabels: ["Tennis Court"] });
  assert.equal(explainQueryMatch(record, "Section 4").reason, "Alternative name");
  assert.equal(explainQueryMatch(record, "94117").reason, "ZIP code");
});

test("detail explanations preserve query and filter matches", () => {
  const explanation = explainMatch(record, { amenities: [{ label: "Tennis Court", category: "sports" }] },
    { q: "tennis", amenity: [], activity: ["play-sports"] },
    { activities: [{ id: "play-sports", categories: ["sports"], amenityLabels: [] }] });
  assert.equal(explanation.reason, "Tennis Court");
  assert.deepEqual(explanation.amenityLabels, ["Tennis Court"]);
});

test("single-category filter explanations name the selected category", () => {
  const base = { q: "", activity: [], amenity: [], neighborhood: [], zip: [], place: [], coverage: [] };
  assert.equal(explainFilterMatch({ ...base, activity: ["play-sports"] }), "Matches your Activities filter");
  assert.equal(explainFilterMatch({ ...base, amenity: ["tennis-court", "restrooms"] }), "Matches your Amenities filter");
  assert.equal(explainFilterMatch({ ...base, neighborhood: ["sunset"] }), "Matches your Neighborhoods filter");
  assert.equal(explainFilterMatch({ ...base, zip: ["94117"] }), "Matches your ZIP code filter");
  assert.equal(explainFilterMatch({ ...base, place: ["regional-park"] }), "Matches your Place type filter");
  assert.equal(explainFilterMatch({ ...base, coverage: ["official-page-reviewed"] }), "Matches your Information coverage filter");
});

test("mixed filter categories retain the combined explanation", () => {
  const state = { q: "", activity: [], amenity: ["tennis-court"], neighborhood: ["sunset"], zip: [], place: [], coverage: [] };
  assert.equal(explainFilterMatch(state), "Matches your selected filters");
});

test("result return state identifies the originating destination", () => {
  assert.equal(resultReturnPath("q=tennis&activity=play-sports&page=2", "golden-gate-park"),
    "/explore/?q=tennis&activity=play-sports&page=2&focus=golden-gate-park");
  assert.equal(resultFocusId("golden-gate-park"), "result-golden-gate-park");
});

test("map links use explicit destination coordinates", () => {
  assert.match(googleMapsSearchUrl(37.77, -122.46), /query=37.77%2C-122.46/);
  assert.match(googleMapsDirectionsUrl(37.77, -122.46), /destination=37.77%2C-122.46/);
  assert.match(googleMapsEmbedUrl("example-key", 37.77, -122.46), /embed\/v1\/place\?key=example-key&q=37.77%2C-122.46/);
});

test("map view remains encoded in shareable result state", () => {
  const state = readState("?q=tennis&view=map");
  assert.equal(state.q, "tennis");
  assert.equal(state.view, "map");
  assert.match(stateUrl(state, state), /view=map/);
});
