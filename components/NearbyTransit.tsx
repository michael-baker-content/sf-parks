"use client";

import { useId, useState } from "react";

type TransitRoute = { id: string; shortName: string; longName: string | null; url: string | null };
type TransitStop = {
  stop: { id: string; name: string };
  distanceMiles: number;
  routes: TransitRoute[];
  connectionRoutes?: TransitRoute[];
};
type TransitGroup = { id: string; label: string; icon: string; stops: TransitStop[] };

const officialLinks: Record<string, { label: string; url: string }> = {
  muni: { label: "Check current Muni service", url: "https://www.sfmta.com/getting-around/muni/routes-stops" },
  bart: { label: "Plan a current BART trip", url: "https://www.bart.gov/planner" },
  caltrain: { label: "Plan a current Caltrain trip", url: "https://www.caltrain.com/" }
};

function distanceLabel(distance: number) {
  if (distance < 0.1) return "Less than 0.1 mile away";
  const rounded = distance.toFixed(1);
  return `${rounded} ${rounded === "1.0" ? "mile" : "miles"} away`;
}

function stationDistanceLabel(distance: number) {
  if (distance < 0.1) return "Less than 0.1 mile from this destination";
  const rounded = distance.toFixed(1);
  return `About ${rounded} ${rounded === "1.0" ? "mile" : "miles"} from this destination`;
}

function RouteList({ routes, label }: { routes: TransitRoute[]; label: string }) {
  if (!routes.length) return null;
  return <ul className="app-transit__routes" aria-label={label}>
    {routes.map((route) => <li key={route.id}>{route.shortName}</li>)}
  </ul>;
}

export function NearbyTransit({ groups, retrievedAt }: { groups: TransitGroup[]; retrievedAt: string }) {
  const selectId = useId();
  const muniGroups = groups.filter((group) => group.id === "bus" || group.id === "muni-rail");
  const availableModes = [
    muniGroups.length ? { id: "muni", label: "Muni" } : null,
    groups.some((group) => group.id === "bart") ? { id: "bart", label: "BART + Muni" } : null,
    groups.some((group) => group.id === "caltrain") ? { id: "caltrain", label: "Caltrain + Muni" } : null
  ].filter((option): option is { id: string; label: string } => Boolean(option));
  const [mode, setMode] = useState(availableModes[0]?.id ?? "muni");
  if (!availableModes.length) return null;

  const selectedRail = groups.find((group) => group.id === mode);
  return <section className="app-transit" id="transit" aria-labelledby="transit-title">
    <div className="app-transit__heading">
      <div><h2 id="transit-title">Getting here by transit</h2><p className="usa-hint">Choose how you plan to start your trip.</p></div>
      <div className="app-transit__selector">
        <label htmlFor={selectId}>Traveling by</label>
        <select className="usa-select" id={selectId} value={mode} onChange={(event) => setMode(event.target.value)}>
          {availableModes.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </div>
    </div>

    {mode === "muni" ? <div className="app-transit-grid">{muniGroups.map((group) => <section key={group.id} aria-labelledby={`transit-${group.id}`}>
      <h3 id={`transit-${group.id}`}><span aria-hidden="true">{group.icon}</span> {group.label}</h3>
      <ul>{group.stops.map(({ stop, distanceMiles, routes }) => <li key={stop.id}>
        <strong>{stop.name}</strong><span className="app-transit__distance">{distanceLabel(distanceMiles)}</span>
        <RouteList routes={routes} label={`Routes serving ${stop.name}`} />
      </li>)}</ul>
    </section>)}</div> : selectedRail ? <div className="app-transit-grid app-transit-grid--journey">{selectedRail.stops.map(({ stop, distanceMiles, connectionRoutes }) => <section key={stop.id} aria-labelledby={`transit-${mode}`}>
      <h3 id={`transit-${mode}`}><span aria-hidden="true">{selectedRail.icon}</span> Nearest {selectedRail.label} station</h3>
      <p><strong>{stop.name}</strong><span className="app-transit__distance">{stationDistanceLabel(distanceMiles)}</span></p>
      <h4>Continue by Muni</h4>
      {connectionRoutes?.length ? <><p>These Muni lines serve stops near both the station and this destination:</p><RouteList routes={connectionRoutes} label={`Possible Muni connections from ${stop.name}`} /></> : <p>No single-line Muni connection was identified in the scheduled data. Use the official trip planner for a current route.</p>}
    </section>)}</div> : null}

    <p className="app-transit__actions"><a href={officialLinks[mode].url} rel="external">{officialLinks[mode].label} <span aria-hidden="true">↗</span></a></p>
    <p className="usa-hint app-transit__source">Stops and straight-line distances come from scheduled <a href="https://511.org/open-data/transit" rel="external">511 SF Bay data <span aria-hidden="true">↗</span></a>, retrieved <time dateTime={retrievedAt}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(retrievedAt))}</time>. Suggested Muni connections only identify lines serving both areas; they are not live routing directions. Check the linked agency before traveling for arrivals, transfers, disruptions, and accessibility information.</p>
  </section>;
}
