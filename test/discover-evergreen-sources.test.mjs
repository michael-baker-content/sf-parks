import test from "node:test";
import assert from "node:assert/strict";
import { extractDirectoryEntries, extractFeatureCatalog, matchDestination, normalizePlaceName } from "../scripts/discover-evergreen-sources.mjs";

test("facility directory entries retain official names, addresses, and URLs", () => {
  const entries = extractDirectoryEntries(`<div data-facilityID="141" class="item facility hasRating"><h3><a href="/Facilities/Facility/Details/Example-Park-141"><span> Example Park</span></a></h3><div class="adr"><span class="street-address">1 Main Street</span></div><div class="feat"><ul><li>Trail</li></ul></div></div><nav></nav>`, [{ id: "61", label: "Trail" }]);
  assert.deepEqual(entries, [{ facilityId: "141", name: "Example Park", address: "1 Main Street", url: "https://www.sfrecpark.org/Facilities/Facility/Details/Example-Park-141", features: [{ id: "61", label: "Trail" }] }]);
});

test("feature catalog preserves official identifiers and labels", () => {
  assert.deepEqual(extractFeatureCatalog(`<input class="chkSidebarFeatures" value="61"> Trail</label>`), [{ id: "61", label: "Trail" }]);
});

test("common public-name variants normalize consistently", () => {
  assert.equal(normalizePlaceName("Glen Park Rec Center"), normalizePlaceName("Glen Park Recreation Center"));
});

test("matching accepts exact names and fails closed on weak similarities", () => {
  const entries = [
    { facilityId: "1", name: "Mission Playground", address: "19th Street", url: "https://example.test/1" },
    { facilityId: "2", name: "Mission Creek Park", address: "Channel Street", url: "https://example.test/2" }
  ];
  assert.equal(matchDestination({ publicName: "Mission Playground", address: "19th St" }, entries).status, "matched");
  assert.notEqual(matchDestination({ publicName: "Mission Bay Kids Place", address: "Unknown" }, entries).status, "matched");
});

test("reviewed overrides resolve known public-name variants", () => {
  const entries = [{ facilityId: "1", name: "Pioneer Park", address: "Telegraph Hill", url: "https://example.test/pioneer", features: [] }];
  const result = matchDestination({ id: "telegraph-hill-pioneer-park", publicName: "Telegraph Hill - Pioneer Park" }, entries, "https://example.test/pioneer");
  assert.equal(result.status, "matched");
  assert.equal(result.match.reviewedOverride, true);
});
