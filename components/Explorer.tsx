"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import destinationsDocument from "../data/presentation/generated/destinations.json";
import content from "../data/presentation/ui-content.json";
import index from "../data/search/generated/search-index.json";
import configuration from "../data/search/search-filters.json";
import { explainMatch, filterAndRank } from "../src/lib/search.js";
import { resultFocusId, resultReturnPath } from "../src/lib/result-focus.js";
import { RESULTS_PAGE_SIZE } from "../src/lib/pagination.js";
import { SearchBox } from "./SearchBox";
import { ResultsMap } from "./ResultsMap";

type Destination = (typeof destinationsDocument.records)[number];
type IndexRecord = (typeof index.records)[number];
type Amenity = { label: string; category: string; quantity: number | null; quantityStatus: string };

function currentState(params: URLSearchParams) {
  return {
    q: params.get("q")?.trim() ?? "",
    activity: params.getAll("activity"), amenity: params.getAll("amenity"),
    neighborhood: params.getAll("neighborhood"), zip: params.getAll("zip"), place: params.getAll("place"),
    coverage: params.getAll("coverage"), sort: params.get("sort") ?? "relevance",
    page: Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1), view: params.get("view") === "map" ? "map" : "list",
  };
}

function CheckList({ name, items, selected }: { name: string; items: Array<{ id: string; label: string; count: number; icon?: string }>; selected: string[] }) {
  return items.map((item) => <div className="usa-checkbox" key={item.id}>
    <input className="usa-checkbox__input" id={`${name}-${item.id}`} type="checkbox" name={name} value={item.id} defaultChecked={selected.includes(item.id)} />
    <label className="usa-checkbox__label app-check-label" htmlFor={`${name}-${item.id}`}>
      <span>{item.icon && <span className="app-filter-icon" aria-hidden="true">{item.icon}</span>}{item.label}</span>
      <span className="app-facet-count">{item.count}</span>
    </label>
  </div>);
}

function FilterPanel({ state, expanded, onToggle }: { state: ReturnType<typeof currentState>; expanded: boolean; onToggle: () => void }) {
  const activityItems = configuration.activities.map((item) => ({ ...item, count: index.facets.activities.find((facet) => facet.id === item.id)?.count ?? 0 }));
  const selectionCount = state.activity.length + state.amenity.length + state.neighborhood.length + state.zip.length + state.place.length + state.coverage.length;
  return <><button className="usa-button usa-button--outline app-filter-toggle" type="button" aria-expanded={expanded} aria-controls="result-filters" onClick={onToggle}>
    {expanded ? "Hide filters" : "Show filters"}{selectionCount ? ` (${selectionCount})` : ""}
  </button><form className="app-filters" id="result-filters" action="/explore/" hidden={!expanded}>
    {state.q && <input type="hidden" name="q" value={state.q} />}
    {state.view === "map" && <input type="hidden" name="view" value="map" />}
    <h2>Filter results</h2>
    <details><summary>Activities</summary><fieldset className="usa-fieldset"><legend className="usa-sr-only">Activities</legend><CheckList name="activity" items={activityItems} selected={state.activity} /></fieldset></details>
    <details><summary>Amenities</summary><fieldset className="usa-fieldset"><legend className="usa-sr-only">Amenities</legend><CheckList name="amenity" items={index.facets.amenities} selected={state.amenity} /></fieldset></details>
    <details><summary>Neighborhoods</summary><fieldset className="usa-fieldset"><legend className="usa-sr-only">Neighborhoods</legend><CheckList name="neighborhood" items={index.facets.neighborhoods} selected={state.neighborhood} /></fieldset></details>
    <details><summary>ZIP codes</summary><fieldset className="usa-fieldset"><legend className="usa-sr-only">ZIP codes</legend><CheckList name="zip" items={index.facets.zipcodes} selected={state.zip} /></fieldset></details>
    <details><summary>Place type</summary><fieldset className="usa-fieldset"><legend className="usa-sr-only">Place type</legend><CheckList name="place" items={index.facets.placeTypes} selected={state.place} /></fieldset></details>
    <div className="app-filter-actions"><button className="usa-button" type="submit">Apply filters</button><Link href="/explore/">Clear all</Link></div>
  </form></>;
}

function quantityText(amenity: Amenity) {
  if (amenity.quantityStatus !== "official-page-verified") return amenity.label;
  return `${amenity.quantity} ${(amenity.quantity === 1 ? amenity.label : `${amenity.label}s`).toLowerCase()}`;
}

function exploreUrlWithout(params: URLSearchParams, key: string, value?: string) {
  const next = new URLSearchParams(params.toString());
  next.delete("focus");
  if (value === undefined) next.delete(key);
  else { const remaining = next.getAll(key).filter((item) => item !== value); next.delete(key); for (const item of remaining) next.append(key, item); }
  next.delete("page"); const query = next.toString(); return query ? `/explore/?${query}` : "/explore/";
}

function ActiveCriteria({ state, params }: { state: ReturnType<typeof currentState>; params: URLSearchParams }) {
  const labels = {
    activity: new Map(configuration.activities.map((item) => [item.id, item.label])),
    amenity: new Map(index.facets.amenities.map((item) => [item.id, item.label])),
    neighborhood: new Map(index.facets.neighborhoods.map((item) => [item.id, item.label])),
    zip: new Map(index.facets.zipcodes.map((item) => [item.id, item.label])),
    place: new Map(index.facets.placeTypes.map((item) => [item.id, item.label])),
    coverage: new Map(Object.entries(content.coverage).map(([id, item]) => [id, item.shortLabel])),
  };
  const criteria: Array<{ key: string; value?: string; label: string }> = [];
  if (state.q) criteria.push({ key: "q", label: `Search: ${state.q}` });
  for (const key of ["activity", "amenity", "neighborhood", "zip", "place", "coverage"] as const) {
    for (const value of state[key]) criteria.push({ key, value, label: labels[key].get(value) ?? value });
  }
  if (!criteria.length) return null;
  return <section className="app-active-criteria" aria-labelledby="active-criteria-title">
    <div className="app-active-criteria__heading"><h2 id="active-criteria-title">Your search and filters</h2><Link href="/explore/">Clear all</Link></div>
    <ul>{criteria.map((criterion) => <li key={`${criterion.key}-${criterion.value ?? criterion.label}`}>
      <Link className="app-criterion" href={exploreUrlWithout(params, criterion.key, criterion.value)} aria-label={`Remove ${criterion.label}`}>
        <span>{criterion.label}</span><span aria-hidden="true">×</span>
      </Link>
    </li>)}</ul>
  </section>;
}

function ResultCard({ destination, record, state, returnPath }: { destination: Destination; record: IndexRecord; state: ReturnType<typeof currentState>; returnPath: string }) {
  const matches = new Set<string>();
  const match = explainMatch(record, destination, state, configuration);
  const queryMatches = new Set<string>(match.amenityLabels as string[]);
  for (const label of queryMatches) matches.add(label);
  const matchPriority = (label: string) => queryMatches.has(label) ? 2 : matches.has(label) ? 1 : 0;
  const ordered = [...destination.amenities].sort((a, b) => matchPriority(b.label) - matchPriority(a.label));
  const amenities = ordered.slice(0, content.resultCard.visibleAmenityLimit);
  const more = destination.amenities.length - amenities.length;
  const focusedReturnPath = resultReturnPath(returnPath.includes("?") ? returnPath.slice(returnPath.indexOf("?") + 1) : "", destination.id);
  return <article className="app-result-card">
    <h2><Link id={resultFocusId(destination.id)} href={`/parks/${destination.id}/?return=${encodeURIComponent(focusedReturnPath)}`} onClick={(event) => {
      if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        window.sessionStorage.setItem("sf-parks-return-focus", destination.id);
        window.sessionStorage.setItem("sf-parks-return-path", returnPath);
      }
    }}>{destination.publicName}</Link></h2>
    <p className="app-location">{[destination.neighborhood, destination.address].filter(Boolean).join(" · ") || content.resultCard.locationFallback}</p>
    {match.reason && <p className="app-match-label">{match.reason}{match.reason.startsWith("Matches your") ? ":" : ""}</p>}
    <ul className="app-chip-list" aria-label={matches.size ? "Matching and listed amenities" : "Listed amenities"}>
      {amenities.map((item) => <li className={matches.has(item.label) ? "is-matched" : undefined} key={`${item.category}-${item.label}`}>{quantityText(item)}</li>)}
      {more > 0 && <li>+{more} more</li>}
    </ul>
  </article>;
}

export function Explorer({ mapStyleUrl }: { mapStyleUrl?: string }) {
  const params = useSearchParams(); const router = useRouter(); const heading = useRef<HTMLHeadingElement>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const state = useMemo(() => currentState(new URLSearchParams(params.toString())), [params]);
  const destinations = useMemo(() => new Map(destinationsDocument.records.map((item) => [item.id, item])), []);
  const results = useMemo(() => filterAndRank(index.records, state), [state]);
  const hasSearchCriteria = Boolean(state.q || state.activity.length || state.amenity.length || state.neighborhood.length || state.zip.length || state.place.length || state.coverage.length);
  const visible = results.slice(0, state.page * RESULTS_PAGE_SIZE);
  const shareableParams = new URLSearchParams(params.toString()); shareableParams.delete("focus");
  const returnPath = `/explore/${shareableParams.toString() ? `?${shareableParams.toString()}` : ""}`;
  useEffect(() => { document.title = "Explore · SF Parks Explorer"; }, []);
  useEffect(() => {
    const cleanParams = new URLSearchParams(params.toString()); cleanParams.delete("focus");
    const currentReturnPath = `/explore/${cleanParams.toString() ? `?${cleanParams.toString()}` : ""}`;
    const storedFocus = window.sessionStorage.getItem("sf-parks-return-path") === currentReturnPath ? window.sessionStorage.getItem("sf-parks-return-focus") : null;
    const destinationId = params.get("focus") ?? storedFocus;
    if (!destinationId) return;
    const target = document.getElementById(resultFocusId(destinationId));
    if (!target) return;
    const frame = window.requestAnimationFrame(() => {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "center" });
      window.sessionStorage.removeItem("sf-parks-return-focus");
      window.sessionStorage.removeItem("sf-parks-return-path");
      const clean = new URL(window.location.href); clean.searchParams.delete("focus");
      window.history.replaceState(window.history.state, "", `${clean.pathname}${clean.search}${clean.hash}`);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [params, visible.length]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const next = new URLSearchParams(params.toString());
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    if (q) next.set("q", q); else next.delete("q"); next.delete("focus"); next.delete("page"); router.push(`/explore/?${next}`);
  }
  function sort(value: string) { const next = new URLSearchParams(params.toString()); next.delete("focus"); if (value === "relevance") next.delete("sort"); else next.set("sort", value); next.delete("page"); router.push(`/explore/?${next}`); }
  function nextPage() { const next = new URLSearchParams(params.toString()); next.delete("focus"); next.set("page", String(state.page + 1)); router.push(`/explore/?${next}`); }
  function toggleMap() { const next = new URLSearchParams(params.toString()); next.delete("focus"); if (state.view === "map") next.delete("view"); else next.set("view", "map"); router.push(`/explore/?${next}`, { scroll: false }); }

  return <>
    <SearchBox id="explore-search" label="Search destinations" defaultValue={state.q} key={state.q} onSubmit={search} />
    <ActiveCriteria state={state} params={shareableParams} />
    <div className="app-explore-layout"><aside><FilterPanel state={state} expanded={filtersExpanded} onToggle={() => setFiltersExpanded((value) => !value)} /></aside><section aria-labelledby="results-title">
      <div className="app-results-heading"><div><h1 id="results-title" ref={heading}>Explore parks and recreation</h1><p className="usa-sr-only" aria-live="polite">{results.length} destinations found</p><p aria-hidden="true">{results.length} {results.length === 1 ? "destination" : "destinations"}</p></div>
        <div className="app-result-tools">{mapStyleUrl && <button className="usa-button usa-button--outline" type="button" aria-expanded={state.view === "map"} aria-controls="results-map-panel" onClick={toggleMap}>{state.view === "map" ? "Hide map" : "Show map"}</button>}<label className="usa-label app-sort">Sort <select className="usa-select" value={state.sort} onChange={(event) => sort(event.target.value)}><option value="relevance">Relevance</option><option value="name">Name</option><option value="amenities">Most amenities</option></select></label></div>
      </div>
      {mapStyleUrl && state.view === "map" && <section id="results-map-panel" aria-label="Map view"><p className="usa-hint">The map shows destinations with usable listed coordinates. With no search or filters, it starts with San Francisco proper; relevant searches can expand to outlying Recreation and Parks properties. Use the complete results list below for accessible browsing.</p><ResultsMap key={params.toString()} styleUrl={mapStyleUrl} preferCoreCity={!hasSearchCriteria} destinations={results.flatMap(({ record }: { record: IndexRecord }) => { const destination = destinations.get(record.id); return destination?.displayPoint ? [{ id: destination.id, name: destination.publicName, latitude: destination.displayPoint.latitude, longitude: destination.displayPoint.longitude, amenityCount: destination.amenities.length, href: `/parks/${destination.id}/?return=${encodeURIComponent(resultReturnPath(shareableParams.toString(), destination.id))}` }] : []; })} /></section>}
      {results.length ? <><div className="app-result-list">{visible.map(({ record }: { record: IndexRecord }) => <ResultCard key={record.id} destination={destinations.get(record.id)!} record={record} state={state} returnPath={returnPath} />)}</div>
        {visible.length < results.length && <button className="usa-button usa-button--outline app-more" type="button" onClick={nextPage}>Show more results</button>}</>
        : <div className="app-empty"><h2>No listed matches</h2><p>No destinations are currently listed with all selected features. This may reflect incomplete data rather than confirmed absence.</p><Link href="/explore/">Clear filters</Link></div>}
    </section></div>
  </>;
}
