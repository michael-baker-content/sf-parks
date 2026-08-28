import { distanceMiles } from "./nearby-destinations.js";

const groups = [
  { id: "bus", label: "Muni bus", icon: "🚌", agencyId: "SF", modes: new Set(["bus"]), limit: 3, maxDistanceMiles: 0.5 },
  { id: "muni-rail", label: "Muni rail and streetcar", icon: "🚋", agencyId: "SF", modes: new Set(["muni-rail", "cable-car"]), limit: 3, maxDistanceMiles: 0.75 },
  { id: "bart", label: "BART", icon: "🚇", agencyId: "BA", modes: new Set(["bart"]), limit: 1, maxDistanceMiles: 6 },
  { id: "caltrain", label: "Caltrain", icon: "🚆", agencyId: "CT", modes: new Set(["caltrain"]), limit: 1, maxDistanceMiles: 6 }
];

function normalizedName(value) {
  return value.trim().toLocaleLowerCase("en-US");
}

export function nearbyTransit(transit, point) {
  if (!point) return [];
  const routes = new Map(transit.routes.map((route) => [route.id, route]));

  const results = groups.map((group) => {
    const candidates = new Map();
    for (const stop of transit.stops) {
      if (stop.agencyId !== group.agencyId) continue;
      const routeIds = stop.routeIds.filter((routeId) => group.modes.has(routes.get(routeId)?.mode));
      if (!routeIds.length) continue;
      const distance = distanceMiles(point, stop);
      if (distance > group.maxDistanceMiles) continue;
      const key = normalizedName(stop.name);
      const existing = candidates.get(key);
      if (!existing || distance < existing.distanceMiles) {
        candidates.set(key, { stop, distanceMiles: distance, routeIds: new Set(routeIds) });
      } else {
        routeIds.forEach((routeId) => existing.routeIds.add(routeId));
      }
    }

    const stops = [...candidates.values()]
      .sort((a, b) => a.distanceMiles - b.distanceMiles || a.stop.name.localeCompare(b.stop.name))
      .slice(0, group.limit)
      .map((candidate) => ({
        stop: candidate.stop,
        distanceMiles: candidate.distanceMiles,
        routes: [...candidate.routeIds].map((routeId) => routes.get(routeId))
          .sort((a, b) => a.shortName.localeCompare(b.shortName, "en", { numeric: true }))
      }));
    return { id: group.id, label: group.label, icon: group.icon, stops };
  }).filter((group) => group.stops.length);

  const nearbyMuniRouteIds = new Set(results
    .filter((group) => group.id === "bus" || group.id === "muni-rail")
    .flatMap((group) => group.stops.flatMap((result) => result.routes.map((route) => route.id))));

  for (const group of results.filter((item) => item.id === "bart" || item.id === "caltrain")) {
    for (const result of group.stops) {
      const stationMuniRouteIds = new Set(transit.stops
        .filter((stop) => stop.agencyId === "SF" && distanceMiles(result.stop, stop) <= 0.4)
        .flatMap((stop) => stop.routeIds)
        .filter((routeId) => routes.get(routeId)?.agencyId === "SF"));
      result.connectionRoutes = [...stationMuniRouteIds]
        .filter((routeId) => nearbyMuniRouteIds.has(routeId))
        .map((routeId) => routes.get(routeId))
        .sort((a, b) => a.shortName.localeCompare(b.shortName, "en", { numeric: true }));
    }
  }
  return results;
}
