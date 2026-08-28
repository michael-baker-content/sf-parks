import assert from "node:assert/strict";
import test from "node:test";
import { nearbyTransit } from "../src/lib/nearby-transit.js";

const transit = {
  routes: [
    { id: "bus-1", agencyId: "SF", mode: "bus", shortName: "5" },
    { id: "rail-n", agencyId: "SF", mode: "muni-rail", shortName: "N" },
    { id: "bart", agencyId: "BA", mode: "bart", shortName: "Blue" },
    { id: "caltrain", agencyId: "CT", mode: "caltrain", shortName: "Local" }
  ],
  stops: [
    { id: "a", agencyId: "SF", name: "Fulton & 10th Ave", latitude: 37.77, longitude: -122.46, routeIds: ["bus-1"] },
    { id: "b", agencyId: "SF", name: "Judah & 9th Ave", latitude: 37.765, longitude: -122.457, routeIds: ["rail-n"] },
    { id: "c", agencyId: "BA", name: "Civic Center", latitude: 37.779, longitude: -122.414, routeIds: ["bart"] },
    { id: "c-bus", agencyId: "SF", name: "Market & Civic Center", latitude: 37.779, longitude: -122.414, routeIds: ["bus-1"] },
    { id: "d", agencyId: "CT", name: "San Francisco", latitude: 37.776, longitude: -122.394, routeIds: ["caltrain"] },
    { id: "far", agencyId: "SF", name: "Far away", latitude: 38.2, longitude: -122.46, routeIds: ["bus-1"] }
  ]
};

test("nearby transit uses mode-specific distance limits", () => {
  const groups = nearbyTransit(transit, { latitude: 37.769, longitude: -122.457 });
  assert.deepEqual(groups.map((group) => group.id), ["bus", "muni-rail", "bart", "caltrain"]);
  assert.equal(groups[0].stops[0].routes[0].shortName, "5");
  assert.equal(groups[1].stops[0].stop.name, "Judah & 9th Ave");
  assert.equal(groups[2].stops[0].connectionRoutes[0].shortName, "5");
});

test("destinations without coordinates do not receive transit claims", () => {
  assert.deepEqual(nearbyTransit(transit, null), []);
});
