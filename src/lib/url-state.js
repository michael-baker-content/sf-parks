const repeatableKeys = ["activity", "amenity", "area", "neighborhood", "zip", "place", "coverage"];

export function readState(search = window.location.search) {
  const params = new URLSearchParams(search);
  const state = {
    q: params.get("q")?.trim() ?? "", destination: params.get("destination"),
    explore: params.has("explore"), about: params.has("about"),
    sort: params.get("sort") ?? "relevance", view: params.get("view") === "map" ? "map" : "list",
    minAmenities: Math.max(0, Number.parseInt(params.get("minAmenities") ?? "0", 10) || 0),
    minAcres: Math.max(0, Number.parseFloat(params.get("minAcres") ?? "0") || 0),
    page: Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1)
  };
  for (const key of repeatableKeys) state[key] = params.getAll(key);
  return state;
}

export function stateUrl(changes, current = readState()) {
  const next = { ...current, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  for (const key of repeatableKeys) for (const value of next[key] ?? []) params.append(key, value);
  if (next.destination) params.set("destination", next.destination);
  if (next.explore && !next.destination) params.set("explore", "1");
  if (next.about) params.set("about", "1");
  if (next.sort && next.sort !== "relevance") params.set("sort", next.sort);
  if (next.minAmenities > 0) params.set("minAmenities", String(next.minAmenities));
  if (next.minAcres > 0) params.set("minAcres", String(next.minAcres));
  if (next.view === "map") params.set("view", "map");
  if (next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function stateFromForm(form, current = readState()) {
  const data = new FormData(form);
  return {
    ...current, q: data.has("q") ? String(data.get("q") ?? "").trim() : current.q,
    activity: data.getAll("activity").map(String), amenity: data.getAll("amenity").map(String), area: data.getAll("area").map(String),
    neighborhood: data.getAll("neighborhood").map(String), zip: data.getAll("zip").map(String), place: data.getAll("place").map(String),
    coverage: data.getAll("coverage").map(String), sort: String(data.get("sort") ?? current.sort),
    minAmenities: Math.max(0, Number.parseInt(String(data.get("minAmenities") ?? "0"), 10) || 0),
    minAcres: Math.max(0, Number.parseFloat(String(data.get("minAcres") ?? "0")) || 0),
    destination: null, explore: true, about: false, page: 1
  };
}
