"use client";

import Link from "next/link";
import { FormEvent, memo, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import destinationsDocument from "../data/presentation/generated/destinations.json";
import content from "../data/presentation/ui-content.json";
import index from "../data/search/generated/search-index.json";
import configuration from "../data/search/search-filters.json";
import { explainMatch, filterAndRank } from "../src/lib/search.js";
import { readState, stateFromForm, stateParams, stateUrl, stateUrlWithout } from "../src/lib/url-state.js";
import { acreageText, amenityQuantityText } from "../src/lib/display-format.js";
import { resultFocusId, resultReturnPath } from "../src/lib/result-focus.js";
import { RESULTS_PAGE_SIZE } from "../src/lib/pagination.js";
import { SearchBox } from "./SearchBox";
import { ResultsMap } from "./ResultsMap";

type Destination = (typeof destinationsDocument.records)[number];
type IndexRecord = (typeof index.records)[number];

function CheckList({ name, items, selected }: { name: string; items: Array<{ id: string; label: string; count: number; icon?: string }>; selected: string[] }) {
  return items.map((item) => <div className="usa-checkbox" key={item.id}>
    <input className="usa-checkbox__input" id={`${name}-${item.id}`} type="checkbox" name={name} value={item.id} defaultChecked={selected.includes(item.id)} />
    <label className="usa-checkbox__label app-check-label" htmlFor={`${name}-${item.id}`}>
      <span>{item.icon && <span className="app-filter-icon" aria-hidden="true">{item.icon}</span>}{item.label}</span>
      <span className="app-facet-count">{item.count}</span>
    </label>
  </div>);
}

function filterSelectionCount(state: ReturnType<typeof readState>) {
  return state.activity.length + state.amenity.length + state.area.length + state.neighborhood.length + state.zip.length + state.place.length + state.coverage.length + Number(state.minAmenities > 0) + Number(state.minAcres > 0);
}

function FilterPanel({ state, stateKey, expanded, overlay, panelRef, onToggle, onSubmit }: { state: ReturnType<typeof readState>; stateKey: string; expanded: boolean; overlay: boolean; panelRef: React.RefObject<HTMLFormElement | null>; onToggle: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const activityItems = configuration.activities.map((item) => ({ ...item, count: index.facets.activities.find((facet) => facet.id === item.id)?.count ?? 0 }));
  return <>{overlay && expanded && <button className="app-filter-backdrop" type="button" tabIndex={-1} aria-label="Close filters" onClick={onToggle} />}
    <form key={stateKey} ref={panelRef} className="app-filters" id="result-filters" action="/explore/" data-expanded={expanded} role={overlay ? "dialog" : undefined} aria-modal={overlay ? "true" : undefined} aria-labelledby="filter-panel-title" onSubmit={onSubmit}>
      {state.q && <input type="hidden" name="q" value={state.q} />}
      {state.view === "map" && <input type="hidden" name="view" value="map" />}
      <div className="app-filter-heading"><h2 id="filter-panel-title">Filter results</h2><button className="usa-button app-filter-close" type="button" onClick={onToggle}><span aria-hidden="true">×</span> Close</button></div>
      <details><summary>Activities</summary><fieldset className="usa-fieldset"><legend className="usa-sr-only">Activities</legend><CheckList name="activity" items={activityItems} selected={state.activity} /></fieldset></details>
      <details><summary>Amenities</summary><fieldset className="usa-fieldset"><legend className="usa-sr-only">Amenities</legend><CheckList name="amenity" items={index.facets.amenities} selected={state.amenity} /></fieldset></details>
      <details><summary>Areas</summary><fieldset className="usa-fieldset"><legend className="usa-sr-only">Areas</legend><p className="usa-hint">Broad browsing areas assembled from the neighborhoods listed in the park data.</p><CheckList name="area" items={index.facets.areas} selected={state.area} /></fieldset></details>
      <details><summary>Neighborhoods</summary><fieldset className="usa-fieldset"><legend className="usa-sr-only">Neighborhoods</legend><CheckList name="neighborhood" items={index.facets.neighborhoods} selected={state.neighborhood} /></fieldset></details>
      <details><summary>ZIP codes</summary><fieldset className="usa-fieldset"><legend className="usa-sr-only">ZIP codes</legend><CheckList name="zip" items={index.facets.zipcodes} selected={state.zip} /></fieldset></details>
      <details><summary>Place type</summary><fieldset className="usa-fieldset"><legend className="usa-sr-only">Place type</legend><CheckList name="place" items={index.facets.placeTypes} selected={state.place} /></fieldset></details>
      <details><summary>Minimum size and amenities</summary><fieldset className="usa-fieldset app-threshold-grid"><legend className="usa-sr-only">Minimum size and amenities</legend>
        <label className="usa-label" htmlFor="minimum-amenities">Minimum amenities</label>
        <input className="usa-input" id="minimum-amenities" name="minAmenities" type="number" min="0" step="1" inputMode="numeric" defaultValue={state.minAmenities} />
        <label className="usa-label" htmlFor="minimum-acres">Minimum park size in acres</label>
        <input className="usa-input" id="minimum-acres" name="minAcres" type="number" min="0" step="0.1" inputMode="decimal" defaultValue={state.minAcres} />
        <p className="usa-hint">Park size comes from the official park-property dataset.</p>
      </fieldset></details>
      <div className="app-filter-actions"><button className="usa-button" type="submit">Apply filters</button><Link href="/explore/">Clear all</Link></div>
    </form></>;
}

function ActiveCriteria({ state }: { state: ReturnType<typeof readState> }) {
  const labels = {
    activity: new Map(configuration.activities.map((item) => [item.id, item.label])),
    amenity: new Map(index.facets.amenities.map((item) => [item.id, item.label])),
    area: new Map(index.facets.areas.map((item) => [item.id, item.label])),
    neighborhood: new Map(index.facets.neighborhoods.map((item) => [item.id, item.label])),
    zip: new Map(index.facets.zipcodes.map((item) => [item.id, item.label])),
    place: new Map(index.facets.placeTypes.map((item) => [item.id, item.label])),
    coverage: new Map(Object.entries(content.coverage).map(([id, item]) => [id, item.shortLabel])),
  };
  const criteria: Array<{ key: string; value?: string; label: string }> = [];
  if (state.q) criteria.push({ key: "q", label: `Search: ${state.q}` });
  for (const key of ["activity", "amenity", "area", "neighborhood", "zip", "place", "coverage"] as const) {
    for (const value of state[key]) criteria.push({ key, value, label: labels[key].get(value) ?? value });
  }
  if (state.minAmenities > 0) criteria.push({ key: "minAmenities", label: `At least ${state.minAmenities} amenities` });
  if (state.minAcres > 0) criteria.push({ key: "minAcres", label: `At least ${acreageText(state.minAcres)} acres` });
  if (!criteria.length) return null;
  return <section className="app-active-criteria" aria-labelledby="active-criteria-title">
    <div className="app-active-criteria__heading"><h2 id="active-criteria-title">Your search and filters</h2><Link href="/explore/">Clear all</Link></div>
    <ul>{criteria.map((criterion) => <li key={`${criterion.key}-${criterion.value ?? criterion.label}`}>
      <Link className="app-criterion" href={stateUrlWithout(state, criterion.key, criterion.value)} aria-label={`Remove ${criterion.label}`}>
        <span>{criterion.label}</span><span aria-hidden="true">×</span>
      </Link>
    </li>)}</ul>
  </section>;
}

const ResultCard = memo(function ResultCard({ destination, record, state, returnPath }: { destination: Destination; record: IndexRecord; state: ReturnType<typeof readState>; returnPath: string }) {
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
    {(state.minAmenities > 0 || state.minAcres > 0) && <p className="app-threshold-match">{[
      state.minAmenities > 0 ? `${destination.amenities.length} amenities` : null,
      state.minAcres > 0 && destination.acres !== null ? `${acreageText(destination.acres)} acres` : null
    ].filter(Boolean).join(" · ")}</p>}
    <ul className="app-chip-list" aria-label={matches.size ? "Matching and listed amenities" : "Listed amenities"}>
      {amenities.map((item) => <li className={matches.has(item.label) ? "is-matched" : undefined} key={`${item.category}-${item.label}`}>{amenityQuantityText(item)}</li>)}
      {more > 0 && <li>+{more} more</li>}
    </ul>
  </article>;
});

export function Explorer({ mapStyleUrl }: { mapStyleUrl?: string }) {
  const params = useSearchParams(); const router = useRouter(); const heading = useRef<HTMLHeadingElement>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filterOverlay, setFilterOverlay] = useState(false);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const filterPanel = useRef<HTMLFormElement>(null);
  const paramsString = params.toString();
  const state = useMemo(() => readState(paramsString), [paramsString]);
  const destinations = useMemo(() => new Map(destinationsDocument.records.map((item) => [item.id, item])), []);
  const results = useMemo(() => filterAndRank(index.records, state), [state]);
  const hasSearchCriteria = Boolean(state.q || state.activity.length || state.amenity.length || state.area.length || state.neighborhood.length || state.zip.length || state.place.length || state.coverage.length || state.minAmenities || state.minAcres);
  const selectionCount = filterSelectionCount(state);
  const filterStateKey = JSON.stringify({ q: state.q, activity: state.activity, amenity: state.amenity, area: state.area, neighborhood: state.neighborhood, zip: state.zip, place: state.place, coverage: state.coverage, minAmenities: state.minAmenities, minAcres: state.minAcres });
  const visible = useMemo(() => results.slice(0, state.page * RESULTS_PAGE_SIZE), [results, state.page]);
  const shareableParams = useMemo(() => stateParams({}, state), [state]);
  const shareableQuery = shareableParams.toString();
  const returnPath = `/explore/${shareableQuery ? `?${shareableQuery}` : ""}`;
  const mapDestinations = useMemo(() => results.flatMap(({ record }: { record: IndexRecord }) => {
    const destination = destinations.get(record.id);
    return destination?.displayPoint ? [{
      id: destination.id,
      name: destination.publicName,
      latitude: destination.displayPoint.latitude,
      longitude: destination.displayPoint.longitude,
      amenityCount: destination.amenities.length,
      href: `/parks/${destination.id}/?return=${encodeURIComponent(resultReturnPath(shareableQuery, destination.id))}`,
    }] : [];
  }), [destinations, results, shareableQuery]);
  useEffect(() => { document.title = "Explore · SF Parks Explorer"; }, []);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 48rem)");
    const updateMode = () => {
      setFilterOverlay(query.matches);
      setFiltersExpanded(!query.matches);
    };
    updateMode();
    query.addEventListener("change", updateMode);
    return () => query.removeEventListener("change", updateMode);
  }, []);
  useEffect(() => {
    if (!filterOverlay || !filtersExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = filterPanel.current;
    panel?.querySelector<HTMLButtonElement>(".app-filter-close")?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setFiltersExpanded(false);
        filterTrigger.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>('button, input, select, textarea, summary, a[href], [tabindex]:not([tabindex="-1"])')].filter((item) => !item.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKeyDown); };
  }, [filterOverlay, filtersExpanded]);
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
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.push(stateUrl({ q, page: 1 }, state));
  }
  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (filterOverlay) setFiltersExpanded(false);
    const nextState = stateFromForm(event.currentTarget, state);
    router.push(stateUrl(nextState, state));
  }
  function sort(value: string) { router.push(stateUrl({ sort: value, page: 1 }, state), { scroll: false }); }
  function nextPage() { router.push(stateUrl({ page: state.page + 1 }, state)); }
  function toggleMap() { router.push(stateUrl({ view: state.view === "map" ? "list" : "map" }, state), { scroll: false }); }
  function toggleFilters() {
    if (filtersExpanded) {
      setFiltersExpanded(false);
      window.requestAnimationFrame(() => filterTrigger.current?.focus());
    } else setFiltersExpanded(true);
  }

  return <>
    <SearchBox id="explore-search" label="Search destinations" defaultValue={state.q} key={state.q} onSubmit={search} />
    <ActiveCriteria state={state} />
    <div className="app-explore-layout" data-filters-expanded={filtersExpanded}><aside className="app-filter-panel-container"><FilterPanel state={state} stateKey={filterStateKey} expanded={filtersExpanded} overlay={filterOverlay} panelRef={filterPanel} onToggle={toggleFilters} onSubmit={applyFilters} /></aside><section aria-labelledby="results-title">
      <div className="app-results-heading"><div><h1 id="results-title" ref={heading}>Explore SF parks</h1><p className="usa-sr-only" aria-live="polite">{results.length} destinations found</p><p aria-hidden="true">{results.length} {results.length === 1 ? "destination" : "destinations"}</p></div>
        <div className="app-result-tools">{mapStyleUrl && <button className="usa-button usa-button--outline" type="button" aria-expanded={state.view === "map"} aria-controls="results-map-panel" onClick={toggleMap}>{state.view === "map" ? "Hide map" : "Show map"}</button>}<button ref={filterTrigger} className="usa-button usa-button--outline app-filter-toggle" type="button" aria-expanded={filtersExpanded} aria-controls="result-filters" onClick={toggleFilters}>{filtersExpanded ? "Hide filters" : "Show filters"}{selectionCount ? ` (${selectionCount})` : ""}</button></div>
      </div>
      {mapStyleUrl && state.view === "map" && <section id="results-map-panel" aria-label="Map view"><p className="usa-hint">The map shows destinations with usable listed coordinates. With no search or filters, it starts with San Francisco proper; relevant searches can expand to outlying Recreation and Parks properties. Use the complete results list below for accessible browsing.</p><ResultsMap styleUrl={mapStyleUrl} preferCoreCity={!hasSearchCriteria} destinations={mapDestinations} /></section>}
      <div className="app-results-sort"><label className="usa-label app-sort"><span>Sort</span><select className="usa-select" value={state.sort} onChange={(event) => sort(event.target.value)}><option value="relevance">Relevance</option><option value="name">Name</option><option value="amenities">Most amenities</option></select></label></div>
      {results.length ? <><div className="app-result-list">{visible.map(({ record }: { record: IndexRecord }) => <ResultCard key={record.id} destination={destinations.get(record.id)!} record={record} state={state} returnPath={returnPath} />)}</div>
        {visible.length < results.length && <button className="usa-button usa-button--outline app-more" type="button" onClick={nextPage}>Show more results</button>}</>
        : <div className="app-empty"><h2>No listed matches</h2><p>No destinations are currently listed with all selected features. This may reflect incomplete data rather than confirmed absence.</p><Link href="/explore/">Clear filters</Link></div>}
    </section></div>
  </>;
}
