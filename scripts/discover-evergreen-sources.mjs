import { mkdir, readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

const directoryUrl = "https://www.sfrecpark.org/Facilities?clear=True";
const searchUrl = "https://www.sfrecpark.org/Facilities/Facility/Search";
const destinationsUrl = new URL("../data/presentation/generated/destinations.json", import.meta.url);
const evergreenUrl = new URL("../data/content/evergreen-content.json", import.meta.url);
const deferredUrl = new URL("../data/content/evergreen-deferred.json", import.meta.url);
const matchOverridesUrl = new URL("../data/content/directory-match-overrides.json", import.meta.url);
const outputDirectory = new URL("../data/content/generated/", import.meta.url);
const reportUrl = new URL("evergreen-source-discovery.json", outputDirectory);
const sourceListUrl = new URL("evergreen-sources.json", outputDirectory);

function decodeHtml(value) {
  const entities = { amp: "&", apos: "'", quot: '"', nbsp: " ", ndash: "–", mdash: "—" };
  return value.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match);
}

function cleanText(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function normalizePlaceName(value) {
  return cleanText(String(value)).toLowerCase()
    .replace(/\b(recreation|rec) (center|ctr)\b/g, "recreation center")
    .replace(/\bplay ground\b/g, "playground")
    .replace(/\bmini park\b/g, "park")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bstreet\b/g, "st")
    .replace(/\bsaint\b/g, "st")
    .replace(/\band\b/g, "&")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

export function extractFeatureCatalog(html) {
  const features = [];
  const pattern = /class="chkSidebarFeatures"[^>]*value="(\d+)"[^>]*>\s*([^<]+)/gi;
  for (const match of html.matchAll(pattern)) {
    features.push({ id: match[1], label: cleanText(match[2]) });
  }
  return features;
}

function normalizeAddress(value) {
  return normalizePlaceName(value).replace(/\b(ninth)\b/g, "9th");
}

function tokens(value) {
  return new Set(normalizePlaceName(value).split(" ").filter((token) => token.length > 1));
}

function similarity(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

export function extractDirectoryEntries(html, featureCatalog = []) {
  const entries = [];
  const featureIds = new Map(featureCatalog.map((feature) => [normalizePlaceName(feature.label), feature.id]));
  const itemPattern = /<div\b[^>]*data-facilityID="(\d+)"[^>]*class="[^"]*\bitem\b[^"]*\bfacility\b[^"]*"[^>]*>([\s\S]*?)(?=<div\b[^>]*data-facilityID=|<nav\b|$)/gi;
  for (const match of html.matchAll(itemPattern)) {
    const link = match[2].match(/<h3>[\s\S]*?<a\b[^>]*href="([^"]+)"[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/i);
    if (!link) continue;
    const street = match[2].match(/class="street-address"[^>]*>([\s\S]*?)<\/span>/i);
    const featureBlock = match[2].match(/<div\b[^>]*class="feat"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "";
    const features = [...featureBlock.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((item) => {
      const label = cleanText(item[1]);
      return { id: featureIds.get(normalizePlaceName(label)) ?? null, label };
    });
    entries.push({
      facilityId: match[1],
      name: cleanText(link[2]),
      address: street ? cleanText(street[1]) : null,
      url: new URL(link[1], directoryUrl).href,
      features
    });
  }
  return entries;
}

function cookieHeader(response) {
  const cookies = response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")].filter(Boolean);
  return cookies.map((cookie) => cookie.split(";", 1)[0]).join("; ");
}

async function retrieveDirectory() {
  const headers = { "User-Agent": "SF-Parks-Explorer/0.1 (evergreen source discovery; local build script)" };
  const landing = await fetch(directoryUrl, { headers });
  if (!landing.ok) throw new Error(`Facility directory: HTTP ${landing.status}.`);
  const landingHtml = await landing.text();
  const featureCatalog = extractFeatureCatalog(landingHtml);
  const cookie = cookieHeader(landing);
  const categoryIDs = "7,3,10,4,15,2,11,8,9,5";
  const entries = [];
  for (let pageNumber = 1; pageNumber <= 4; pageNumber += 1) {
    if (pageNumber > 1) await new Promise((resolve) => setTimeout(resolve, 1500));
    const body = new URLSearchParams({
      featureIDs: "", categoryIDs, occupants: "", keywords: "", pageSize: "100",
      pageNumber: String(pageNumber), sortBy: "3", currentLatitude: "",
      currentLongitude: "", isReservableOnly: "false"
    });
    const response = await fetch(searchUrl, {
      method: "POST",
      headers: { ...headers, Cookie: cookie, Referer: directoryUrl, "X-Requested-With": "XMLHttpRequest", "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body
    });
    if (!response.ok) throw new Error(`Facility directory page ${pageNumber}: HTTP ${response.status}.`);
    const pageEntries = extractDirectoryEntries(await response.text(), featureCatalog);
    entries.push(...pageEntries);
    if (pageEntries.length < 100) break;
  }
  return {
    entries: [...new Map(entries.map((entry) => [entry.url.toLowerCase(), entry])).values()],
    featureCatalog
  };
}

export function matchDestination(destination, entries, overrideUrl = null) {
  if (overrideUrl) {
    const entry = entries.find((item) => item.url.toLowerCase() === overrideUrl.toLowerCase());
    if (!entry) throw new Error(`${destination.id}: reviewed directory match override was not found.`);
    return { status: "matched", match: { ...entry, score: 1, reviewedOverride: true }, alternatives: [] };
  }
  const name = normalizePlaceName(destination.publicName);
  const address = normalizeAddress(destination.address ?? "");
  const ranked = entries.map((entry) => {
    const nameScore = similarity(destination.publicName, entry.name);
    const exactName = name === normalizePlaceName(entry.name);
    const exactAddress = address.length >= 5 && address === normalizeAddress(entry.address ?? "");
    const score = exactName ? 1 : Math.min(0.99, nameScore + (exactAddress ? 0.25 : 0));
    return { entry, score, exactName, exactAddress };
  }).sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));
  const best = ranked[0];
  const runnerUp = ranked[1];
  const confident = Boolean(best) && (best.exactName || (best.exactAddress && best.score >= 0.75) || (best.score >= 0.8 && best.score - (runnerUp?.score ?? 0) >= 0.15));
  return {
    status: confident ? "matched" : best?.score >= 0.5 ? "needs-review" : "unmatched",
    match: best ? { ...best.entry, score: Number(best.score.toFixed(3)) } : null,
    alternatives: ranked.slice(1, 4).map(({ entry, score }) => ({ ...entry, score: Number(score.toFixed(3)) }))
  };
}

export async function buildDiscoveryReport({ entries } = {}) {
  const [destinations, evergreen, deferred, matchOverrides] = await Promise.all([
    readFile(destinationsUrl, "utf8").then(JSON.parse),
    readFile(evergreenUrl, "utf8").then(JSON.parse),
    readFile(deferredUrl, "utf8").then(JSON.parse),
    readFile(matchOverridesUrl, "utf8").then(JSON.parse)
  ]);
  const retrieved = entries ? { entries, featureCatalog: [] } : await retrieveDirectory();
  const directoryEntries = retrieved.entries;
  const reviewedIds = new Set(evergreen.records.map((record) => record.destinationId));
  const deferredIds = new Set(deferred.records.map((record) => record.destinationId));
  const overrideMap = new Map(matchOverrides.records.map((record) => [record.destinationId, record.url]));
  const records = destinations.records.map((destination) => ({
    destinationId: destination.id,
    publicName: destination.publicName,
    amenityCount: destination.amenities.length,
    contentStatus: reviewedIds.has(destination.id) ? "reviewed" : deferredIds.has(destination.id) ? "deferred" : "not-reviewed",
    ...matchDestination(destination, directoryEntries, overrideMap.get(destination.id))
  })).sort((a, b) => b.amenityCount - a.amenityCount || a.publicName.localeCompare(b.publicName));
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    ranking: "amenity-count-descending",
    directoryEntryCount: directoryEntries.length,
    directoryFeatureCatalog: retrieved.featureCatalog.map((feature) => ({
      ...feature,
      assignedDirectoryEntryCount: directoryEntries.filter((entry) => entry.features.some((item) => item.id === feature.id)).length
    })),
    summary: Object.fromEntries(["matched", "needs-review", "unmatched"].map((status) => [status, records.filter((record) => record.status === status).length])),
    records
  };
  const sources = {
    schemaVersion: 1,
    generatedAt: report.generatedAt,
    sources: records.filter((record) => record.status === "matched" && record.contentStatus === "not-reviewed")
      .map((record) => ({ destinationId: record.destinationId, url: record.match.url, amenityCount: record.amenityCount }))
  };
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(reportUrl, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
    writeFile(sourceListUrl, `${JSON.stringify(sources, null, 2)}\n`, "utf8")
  ]);
  return { report, sources };
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  try {
    const { report, sources } = await buildDiscoveryReport();
    console.log(`Discovered ${report.directoryEntryCount} official pages: ${report.summary.matched} matched, ${report.summary["needs-review"]} need review, ${report.summary.unmatched} unmatched.`);
    console.log(`Queued ${sources.sources.length} matched destinations without reviewed evergreen content.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
