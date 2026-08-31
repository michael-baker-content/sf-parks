import { escapeHtml, checked } from "../lib/html.js";
import { stateUrl } from "../lib/url-state.js";
import { RESULTS_PAGE_SIZE } from "../lib/pagination.js";

const groupOrder = new Map();
export function configureViews(content) { for (const group of content.amenityGroups) groupOrder.set(group.id, group); }

function searchForm(state, label = "Find a park or recreation destination") {
  return `<form class="search" data-search-form role="search"><label for="site-search">${escapeHtml(label)}</label>
    <div class="search__row"><input id="site-search" name="q" type="search" value="${escapeHtml(state.q)}" autocomplete="off" placeholder="Try “tennis,” “Dolores,” or “94131”"><button type="submit">Search</button></div>
    <p class="hint">Search by place, neighborhood, activity, or amenity.</p></form>`;
}

export function homeView(state, configuration) {
  return `<section class="hero" aria-labelledby="home-title"><p class="eyebrow">Independent public-data prototype</p>
    <h1 id="home-title">Find a park that fits your plans</h1><p class="lede">Explore San Francisco parks, playgrounds, recreation centers, and listed amenities.</p>${searchForm(state)}</section>
    <section id="activities" aria-labelledby="activities-title"><h2 id="activities-title">What would you like to do?</h2><div class="activity-grid">${configuration.activities.map((activity) => `<a class="activity-card" href="${stateUrl({ activity: [activity.id], explore: true })}">${escapeHtml(activity.label)}</a>`).join("")}</div></section>
    <section class="notice" aria-labelledby="coverage-title"><h2 id="coverage-title">About the information</h2><p>Results use open data published by the City of San Francisco. Features not shown may still be available, and only a small number of official facility pages have been reviewed so far.</p></section>`;
}

function checkboxList(name, items, selected) {
  return items.map((item) => `<label class="check-row"><input type="checkbox" name="${name}" value="${escapeHtml(item.id)}"${checked(item.id, selected)}><span>${escapeHtml(item.label)}</span><span class="facet-count">${item.count}</span></label>`).join("");
}
function filterPanel(state, facets, activities) {
  return `<form class="filters" data-filter-form><h2>Filter results</h2>
    <fieldset><legend>Activities</legend>${checkboxList("activity", activities, state.activity)}</fieldset>
    <details><summary>Amenities</summary><fieldset><legend class="visually-hidden">Amenities</legend>${checkboxList("amenity", facets.amenities, state.amenity)}</fieldset></details>
    <details><summary>Areas</summary><fieldset><legend class="visually-hidden">Areas</legend><p class="hint">Broad browsing areas assembled from the neighborhoods listed in the park data.</p>${checkboxList("area", facets.areas, state.area)}</fieldset></details>
    <details><summary>Neighborhoods</summary><fieldset><legend class="visually-hidden">Neighborhoods</legend>${checkboxList("neighborhood", facets.neighborhoods, state.neighborhood)}</fieldset></details>
    <details><summary>ZIP codes</summary><fieldset><legend class="visually-hidden">ZIP codes</legend>${checkboxList("zip", facets.zipcodes, state.zip)}</fieldset></details>
    <details><summary>Place type</summary><fieldset><legend class="visually-hidden">Place type</legend>${checkboxList("place", facets.placeTypes, state.place)}</fieldset></details>
    <details><summary>Minimum size and amenities</summary><fieldset><legend class="visually-hidden">Minimum size and amenities</legend>
      <label>Minimum amenities <input name="minAmenities" type="number" min="0" step="1" value="${state.minAmenities}"></label>
      <label>Minimum park size in acres <input name="minAcres" type="number" min="0" step="0.1" value="${state.minAcres}"></label>
      <p class="hint">Park size comes from the official park-property dataset.</p></fieldset></details>
    <div class="filter-actions"><button type="submit">Apply filters</button><a href="/?explore=1">Clear all</a></div></form>`;
}
function quantityText(amenity) {
  if (amenity.quantityStatus !== "official-page-verified") return amenity.label;
  return `${amenity.quantity} ${(amenity.quantity === 1 ? amenity.label : `${amenity.label}s`).toLowerCase()}`;
}
function matchedLabels(destination, indexRecord, state, configuration) {
  const labels = new Set();
  for (const id of state.amenity) {
    const index = indexRecord.filters.amenityIds.indexOf(id);
    if (index >= 0) labels.add(indexRecord.filters.amenityLabels[index]);
  }
  for (const id of state.activity) {
    const activity = configuration.activities.find((item) => item.id === id);
    for (const amenity of destination.amenities) {
      if (activity?.amenityLabels?.includes(amenity.label) || activity?.categories?.includes(amenity.category)) labels.add(amenity.label);
    }
  }
  return labels;
}
function resultCard(destination, indexRecord, state, content, configuration) {
  const matches = matchedLabels(destination, indexRecord, state, configuration);
  const ordered = [...destination.amenities].sort((a, b) => Number(matches.has(b.label)) - Number(matches.has(a.label)));
  const amenities = ordered.slice(0, content.resultCard.visibleAmenityLimit);
  const more = destination.amenities.length - amenities.length;
  return `<article class="result-card"><h2><a href="${stateUrl({ ...state, destination: destination.id, explore: false, about: false })}">${escapeHtml(destination.publicName)}</a></h2>
    <p class="location">${escapeHtml([destination.neighborhood, destination.address].filter(Boolean).join(" · ") || content.resultCard.locationFallback)}</p>
    ${matches.size ? `<p class="match-label">Matches your filters</p>` : ""}<ul class="chip-list" aria-label="${matches.size ? "Matching and listed amenities" : "Listed amenities"}">${amenities.map((item) => `<li${matches.has(item.label) ? ` class="matched"` : ""}>${escapeHtml(quantityText(item))}</li>`).join("")}${more > 0 ? `<li>+${more} more</li>` : ""}</ul>${destination.coverage === "official-page-reviewed" ? `<p class="coverage">${escapeHtml(content.coverage["official-page-reviewed"].shortLabel)}</p>` : ""}</article>`;
}

export function exploreView(state, results, destinationsById, facets, configuration, content) {
  const visible = results.slice(0, state.page * RESULTS_PAGE_SIZE);
  return `${searchForm(state, "Search destinations")}<div class="explore-layout"><aside>${filterPanel(state, facets, configuration.activities.map((item) => ({ ...item, count: facets.activities.find((facet) => facet.id === item.id)?.count ?? 0 })))}</aside>
    <section aria-labelledby="results-title"><div class="results-heading"><div><h1 id="results-title">Explore parks and recreation</h1><p>${results.length} ${results.length === 1 ? "destination" : "destinations"}</p></div>
    <label>Sort <select name="sort" data-sort><option value="relevance"${state.sort === "relevance" ? " selected" : ""}>Relevance</option><option value="name"${state.sort === "name" ? " selected" : ""}>Name</option><option value="amenities"${state.sort === "amenities" ? " selected" : ""}>Most amenities</option></select></label></div>
    ${results.length ? `<div class="result-list">${visible.map(({ record }) => resultCard(destinationsById.get(record.id), record, state, content, configuration)).join("")}</div>${visible.length < results.length ? `<a class="button secondary" href="${stateUrl({ ...state, page: state.page + 1 })}">Show more results</a>` : ""}`
      : `<div class="empty-state"><h2>No listed matches</h2><p>No destinations are currently listed with all selected features. This may reflect incomplete data rather than confirmed absence.</p><a href="/?explore=1">Clear filters</a></div>`}</section></div>`;
}

export function destinationView(destination, state, content) {
  const grouped = Object.groupBy(destination.amenities, (item) => item.category);
  const groups = Object.entries(grouped).sort(([a], [b]) => (groupOrder.get(a)?.order ?? 999) - (groupOrder.get(b)?.order ?? 999));
  const officialUrl = destination.enrichment?.sourceUrl ?? destination.presentationReview?.sourceUrl;
  const officialAction = destination.enrichment ? content.officialActions["facility-page"] : content.officialActions["information-page"];
  const normalizedQuery = state.q.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const matchedSourceAlias = destination.kind === "virtual-property" && normalizedQuery
    && destination.searchableAliases.some((item) => item.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === normalizedQuery);
  const showSubplaces = destination.kind !== "virtual-property" && destination.subplaces.length > 1;
  return `<a class="back-link" href="${stateUrl({ ...state, destination: null, explore: true })}">← Back to results</a><article class="destination">
    <header><p class="eyebrow">${escapeHtml(destination.placeTypes.join(" · "))}</p><h1>${escapeHtml(destination.publicName)}</h1><p class="location">${escapeHtml([destination.neighborhood, destination.address].filter(Boolean).join(" · "))}</p></header>
    ${matchedSourceAlias ? `<div class="notice"><p><strong>Your search matched an internal source name.</strong> ${escapeHtml(state.q)} is part of the combined ${escapeHtml(destination.publicName)} destination.</p></div>` : ""}
    <section aria-labelledby="amenities-title"><h2 id="amenities-title">What is listed here</h2><p class="hint">${escapeHtml(content.quantityNotice)}</p><div class="amenity-groups">${groups.map(([id, items]) => `<section><h3>${escapeHtml(groupOrder.get(id)?.label ?? id)}</h3><ul>${items.map((item) => `<li>${escapeHtml(quantityText(item))}</li>`).join("")}</ul></section>`).join("")}</div></section>
    ${showSubplaces ? `<section aria-labelledby="subplaces-title"><h2 id="subplaces-title">Places within this destination</h2><ul>${destination.subplaces.map((item) => `<li><strong>${escapeHtml(item.label)}</strong> <span class="muted">(${escapeHtml(item.type)})</span></li>`).join("")}</ul></section>` : ""}
    <section class="official-actions" aria-labelledby="official-title"><h2 id="official-title">Official information and next steps</h2>${officialUrl ? `<p><a class="button" href="${escapeHtml(officialUrl)}" rel="external">${escapeHtml(officialAction.label)}</a></p><p class="hint">${escapeHtml(content.handoffNotice)}</p>` : `<p>${escapeHtml(content.emptyOfficialActions)}</p>`}</section>
    <section class="coverage-panel" aria-labelledby="coverage-detail-title"><h2 id="coverage-detail-title">Information coverage</h2><p><strong>${escapeHtml(content.coverage[destination.coverage].shortLabel)}</strong></p><p>${escapeHtml(content.coverage[destination.coverage].description)}</p><p>${escapeHtml(content.coverage[destination.coverage].missingInformation)}</p></section>
    <details><summary>Source details</summary><p>Contributing property IDs: ${destination.propertyIds.map(escapeHtml).join(", ")}</p></details></article>`;
}
export const aboutView = (content) => `<article class="prose"><h1>About the data</h1><p>SF Parks Explorer is an independent prototype that reorganizes information published by the City of San Francisco around resident tasks.</p><h2>What the data can tell us</h2><p>The explorer uses official open data describing park properties, facilities, functional areas, and maintained assets.</p><h2>What it cannot guarantee</h2><p>${escapeHtml(content.coverage["open-data-only"].missingInformation)}</p><h2>Independent project</h2><p>${escapeHtml(content.independenceNotice)}</p></article>`;
export const errorView = (message) => `<div class="empty-state"><h1>We could not load the explorer</h1><p>${escapeHtml(message)}</p></div>`;
