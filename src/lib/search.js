export function normalizeSearchText(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
const all = (selected, available) => selected.every((value) => available.includes(value));
const any = (selected, available) => !selected.length || selected.some((value) => available.includes(value));
const threshold = (value) => Math.max(0, Number(value) || 0);

export function scoreRecord(record, query) {
  const q = normalizeSearchText(query);
  if (!q) return 0;
  const n = record.normalized;
  if (n.publicName === q) return 100;
  if (n.publicName.startsWith(q)) return 90;
  if (n.aliases.includes(q)) return 85;
  if (n.aliases.some((value) => value.startsWith(q))) return 80;
  const tokens = q.split(" ");
  if (tokens.every((token) => n.publicName.includes(token))) return 70;
  if (n.amenityTerms.includes(q)) return 65;
  if ([n.neighborhood, n.zipcode, n.address].includes(q)) return 60;
  if (tokens.every((token) => n.combined.includes(token))) return 40;
  return -1;
}

export function explainQueryMatch(record, query) {
  const q = normalizeSearchText(query);
  if (!q) return { reason: null, amenityLabels: [] };
  const tokens = q.split(" ");
  const containsTokens = (value) => tokens.every((token) => value.includes(token));
  const amenityLabels = (record.filters.amenityLabels ?? []).filter((label) => containsTokens(normalizeSearchText(label)));
  if (amenityLabels.length) return { reason: amenityLabels.join(", "), amenityLabels };
  if (containsTokens(record.normalized.publicName)) return { reason: "Destination name", amenityLabels };
  if (record.normalized.aliases.some(containsTokens)) return { reason: "Alternative name", amenityLabels };
  if (containsTokens(record.normalized.neighborhood)) return { reason: "Neighborhood", amenityLabels };
  if (record.normalized.zipcode === q) return { reason: "ZIP code", amenityLabels };
  if (containsTokens(record.normalized.address)) return { reason: "Address", amenityLabels };
  return { reason: "Related listing information", amenityLabels };
}

export function explainFilterMatch(state) {
  const categories = [
    ["activity", "Activities"],
    ["amenity", "Amenities"],
    ["area", "Area"],
    ["neighborhood", "Neighborhoods"],
    ["zip", "ZIP code"],
    ["place", "Place type"],
    ["coverage", "Information coverage"]
  ].filter(([key]) => (state[key] ?? []).length > 0);
  if (threshold(state.minAmenities) > 0) categories.push(["minAmenities", "Amenity count"]);
  if (threshold(state.minAcres) > 0) categories.push(["minAcres", "Park size"]);
  if (categories.length === 1) return `Matches your ${categories[0][1]} filter`;
  if (categories.length > 1) return "Matches your selected filters";
  return null;
}

export function explainMatch(record, destination, state, configuration) {
  const queryMatch = explainQueryMatch(record, state.q);
  const amenityLabels = new Set(queryMatch.amenityLabels);
  for (const id of state.amenity ?? []) {
    const position = record.filters.amenityIds.indexOf(id);
    if (position >= 0) amenityLabels.add(record.filters.amenityLabels[position]);
  }
  for (const id of state.activity ?? []) {
    const activity = configuration.activities.find((item) => item.id === id);
    for (const amenity of destination.amenities) {
      if (activity?.amenityLabels?.includes(amenity.label) || activity?.categories?.includes(amenity.category)) amenityLabels.add(amenity.label);
    }
  }
  return {
    reason: queryMatch.reason ?? explainFilterMatch(state),
    amenityLabels: [...amenityLabels]
  };
}

export function filterAndRank(records, state) {
  return records.map((record) => ({ record, score: scoreRecord(record, state.q) }))
    .filter(({ record, score }) => score >= 0 && all(state.activity, record.filters.activityIds)
      && all(state.amenity, record.filters.amenityIds) && any(state.area ?? [], record.filters.areaIds ?? [])
      && any(state.neighborhood, record.filters.neighborhoodIds)
      && any(state.zip ?? [], record.filters.zipcode ? [record.filters.zipcode] : [])
      && any(state.place, record.filters.placeTypeIds) && any(state.coverage, [record.filters.coverage])
      && record.filters.amenityLabels.length >= threshold(state.minAmenities)
      && (threshold(state.minAcres) === 0 || Number.isFinite(record.display.acres)
        && record.display.acres >= threshold(state.minAcres)))
    .sort((a, b) => {
      if (state.sort === "name") return a.record.publicName.localeCompare(b.record.publicName);
      if (state.sort === "amenities") return b.record.filters.amenityLabels.length - a.record.filters.amenityLabels.length
        || a.record.publicName.localeCompare(b.record.publicName);
      return b.score - a.score || a.record.publicName.localeCompare(b.record.publicName);
    });
}
