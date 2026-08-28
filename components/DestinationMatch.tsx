"use client";

import { useSearchParams } from "next/navigation";
import destinationsDocument from "../data/presentation/generated/destinations.json";
import index from "../data/search/generated/search-index.json";
import configuration from "../data/search/search-filters.json";
import { explainMatch } from "../src/lib/search.js";

export function DestinationMatch({ destinationId }: { destinationId: string }) {
  const params = useSearchParams();
  const returnPath = params.get("return");
  if (!returnPath?.startsWith("/explore/")) return null;
  const query = returnPath.includes("?") ? returnPath.slice(returnPath.indexOf("?") + 1) : "";
  const search = new URLSearchParams(query);
  const state = {
    q: search.get("q")?.trim() ?? "",
    activity: search.getAll("activity"), amenity: search.getAll("amenity"),
    neighborhood: search.getAll("neighborhood"), zip: search.getAll("zip"),
    place: search.getAll("place"), coverage: search.getAll("coverage")
  };
  if (!state.q && !state.activity.length && !state.amenity.length && !state.neighborhood.length && !state.zip.length && !state.place.length && !state.coverage.length) return null;
  const record = index.records.find((item) => item.id === destinationId);
  const destination = destinationsDocument.records.find((item) => item.id === destinationId);
  if (!record || !destination) return null;
  const match = explainMatch(record, destination, state, configuration);
  if (!match.reason) return null;
  return <section className="app-destination-match" aria-labelledby="destination-match-title">
    <h2 id="destination-match-title">Why this matched</h2>
    <p>{match.reason}</p>
    {match.amenityLabels.length > 0 && <ul className="app-chip-list" aria-label="Matching amenities">{match.amenityLabels.map((label: string) => <li className="is-matched" key={label}>{label}</li>)}</ul>}
  </section>;
}
