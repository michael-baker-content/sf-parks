import { filterAndRank } from "./lib/search.js";
import { readState, stateFromForm, stateUrl } from "./lib/url-state.js";
import { aboutView, configureViews, destinationView, errorView, exploreView, homeView } from "./components/views.js";

const app = document.querySelector("#app"); const liveRegion = document.querySelector("#live-region"); let data;
async function loadJson(url) { const response = await fetch(url); if (!response.ok) throw new Error(`Data request failed (${response.status}).`); return response.json(); }
function navigate(url) { history.pushState({}, "", url); render().then(() => document.querySelector("#main-content")?.focus()); }
function bindInteractions() {
  document.querySelectorAll("a[href^='/']").forEach((link) => link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || link.hasAttribute("download")) return;
    event.preventDefault(); navigate(link.getAttribute("href"));
  }));
  document.querySelectorAll("[data-search-form]").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault(); navigate(stateUrl({ ...readState(), q: new FormData(form).get("q")?.toString().trim(), explore: true, about: false, destination: null, page: 1 }));
  }));
  document.querySelector("[data-filter-form]")?.addEventListener("submit", (event) => { event.preventDefault(); navigate(stateUrl(stateFromForm(event.currentTarget))); });
  document.querySelector("[data-sort]")?.addEventListener("change", (event) => navigate(stateUrl({ ...readState(), sort: event.target.value, page: 1 })));
}
async function render() {
  try {
    data ??= await Promise.all([loadJson("/data/search/generated/search-index.json"), loadJson("/data/presentation/generated/destinations.json"), loadJson("/data/search/search-filters.json"), loadJson("/data/presentation/ui-content.json")]);
    const [index, destinationsDocument, configuration, content] = data; configureViews(content); const state = readState();
    const destinationsById = new Map(destinationsDocument.records.map((item) => [item.id, item]));
    if (state.destination) { const destination = destinationsById.get(state.destination); app.innerHTML = destination ? destinationView(destination, state, content) : errorView("That destination was not found."); document.title = destination ? `${destination.publicName} · SF Parks Explorer` : "Not found · SF Parks Explorer"; }
    else if (state.about) { app.innerHTML = aboutView(content); document.title = "About the data · SF Parks Explorer"; }
    else if (state.explore || state.q || state.activity.length || state.amenity.length || state.neighborhood.length || state.place.length) { const results = filterAndRank(index.records, state); app.innerHTML = exploreView(state, results, destinationsById, index.facets, configuration, content); liveRegion.textContent = `${results.length} destinations found.`; document.title = "Explore · SF Parks Explorer"; }
    else { app.innerHTML = homeView(state, configuration); document.title = "SF Parks Explorer"; }
    app.setAttribute("aria-busy", "false"); bindInteractions();
  } catch (error) { app.innerHTML = errorView(error.message); app.setAttribute("aria-busy", "false"); }
}
window.addEventListener("popstate", render); render();

