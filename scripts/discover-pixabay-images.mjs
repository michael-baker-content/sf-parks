import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import process from "node:process";

const destinationsUrl = new URL("../data/presentation/generated/destinations.json", import.meta.url);
const manifestUrl = new URL("../data/media/media-manifest.json", import.meta.url);
const reviewsUrl = new URL("../data/media/pixabay-image-reviews.json", import.meta.url);
const envUrl = new URL("../.env.local", import.meta.url);
const cacheDirectoryUrl = new URL("../data/media/generated/cache/pixabay/", import.meta.url);
const outputUrl = new URL("../data/media/generated/pixabay-image-candidates.json", import.meta.url);
const cacheLifetimeMs = 24 * 60 * 60 * 1000;
const requestDelayMs = 1000;
const pilotSize = 5;

function parseEnv(text) {
  return Object.fromEntries(String(text).split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) return [];
    return [[match[1], match[2].trim().replace(/^(["'])(.*)\1$/, "$2")]];
  }));
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const genericIdentityTerms = new Set(["park", "playground", "recreation", "rec", "center"]);

function identityTerms(destination) {
  return destination.publicName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((term) => term && !genericIdentityTerms.has(term));
}

function identityMatch(destination, hit) {
  const haystack = `${hit.tags ?? ""} ${decodeURIComponent(hit.pageURL ?? "")}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
  const terms = identityTerms(destination);
  return terms.length > 0 && terms.every((term) => haystack.split(/\s+/).includes(term));
}

function presentHit(hit, review) {
  return {
    pixabayId: hit.id,
    pageUrl: hit.pageURL,
    previewUrl: hit.webformatURL,
    downloadCandidateUrl: hit.largeImageURL,
    width: hit.imageWidth,
    height: hit.imageHeight,
    photographer: hit.user,
    photographerId: hit.user_id,
    tags: hit.tags,
    reviewStatus: review?.status ?? "pending",
    reviewNotes: review?.reason ?? "Confirm exact destination, venue-level subject fit, people and trademark concerns, and the retained Pixabay license record before downloading."
  };
}

function cacheName(destinationId) {
  return new URL(`${destinationId}.json`, cacheDirectoryUrl);
}

async function readFreshCache(url) {
  try {
    const details = await stat(url);
    if (Date.now() - details.mtimeMs > cacheLifetimeMs) return null;
    return JSON.parse(await readFile(url, "utf8"));
  } catch {
    return null;
  }
}

async function fetchPixabay(destination, apiKey) {
  const cached = await readFreshCache(cacheName(destination.id));
  if (cached) return { document: cached, cacheStatus: "reused" };
  const url = new URL("https://pixabay.com/api/");
  url.search = new URLSearchParams({
    key: apiKey,
    q: `${destination.publicName} San Francisco`,
    image_type: "photo",
    safesearch: "true",
    min_width: "800",
    per_page: "10"
  });
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Pixabay request failed with status ${response.status}.`);
  const document = await response.json();
  await writeFile(cacheName(destination.id), `${JSON.stringify(document, null, 2)}\n`);
  return { document, cacheStatus: "refreshed" };
}

const destinations = JSON.parse(await readFile(destinationsUrl, "utf8")).records;
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const reviewDocument = JSON.parse(await readFile(reviewsUrl, "utf8"));
const reviewsByKey = new Map(reviewDocument.reviews.map((review) => [`${review.destinationId}:${review.pixabayId}`, review]));
const publishedIds = new Set(manifest.images.map((image) => image.destinationId));
const pilotDestinations = destinations
  .filter((destination) => !publishedIds.has(destination.id))
  .sort((left, right) => (right.amenities?.length ?? 0) - (left.amenities?.length ?? 0) || left.id.localeCompare(right.id))
  .slice(0, pilotSize);

if (process.argv.includes("--plan")) {
  console.log("Pixabay pilot destinations:");
  for (const destination of pilotDestinations) console.log(`- ${destination.publicName} (${destination.amenities?.length ?? 0} amenities)`);
  process.exit(0);
}

let env = {};
try { env = parseEnv(await readFile(envUrl, "utf8")); } catch {}
const apiKey = process.env.PIXABAY_API_KEY || env.PIXABAY_API_KEY;
if (!apiKey) {
  console.error("PIXABAY_API_KEY is not configured. Add it to .env.local, then rerun this command.");
  process.exit(1);
}

await mkdir(cacheDirectoryUrl, { recursive: true });
const candidates = [];
for (const [index, destination] of pilotDestinations.entries()) {
  if (index > 0) await sleep(requestDelayMs);
  const { document, cacheStatus } = await fetchPixabay(destination, apiKey);
  const rawHits = document.hits ?? [];
  const matchedHits = rawHits.filter((hit) => identityMatch(destination, hit));
  const discardedHits = rawHits.filter((hit) => !identityMatch(destination, hit));
  candidates.push({
    destinationId: destination.id,
    destinationName: destination.publicName,
    amenityCount: destination.amenities?.length ?? 0,
    query: `${destination.publicName} San Francisco`,
    cacheStatus,
    rawHitCount: rawHits.length,
    hits: matchedHits.map((hit) => presentHit(hit, reviewsByKey.get(`${destination.id}:${hit.id}`))),
    discardedHits: discardedHits.map((hit) => ({
      pixabayId: hit.id,
      pageUrl: hit.pageURL,
      tags: hit.tags,
      reviewStatus: "rejected-identity-mismatch",
      reviewNotes: "The result does not contain the destination's distinctive name terms in its tags or source-page identity."
    }))
  });
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  publicationStatus: "candidate-review-only",
  source: "Pixabay API",
  sourceLicense: "Pixabay Content License",
  sourceLicenseUrl: "https://pixabay.com/service/license-summary/",
  queryCount: candidates.length,
  rawHitCount: candidates.reduce((sum, candidate) => sum + candidate.rawHitCount, 0),
  candidateCount: candidates.reduce((sum, candidate) => sum + candidate.hits.length, 0),
  pendingCandidateCount: candidates.reduce((sum, candidate) => sum + candidate.hits.filter((hit) => hit.reviewStatus === "pending").length, 0),
  discardedHitCount: candidates.reduce((sum, candidate) => sum + candidate.discardedHits.length, 0),
  candidates
};
await writeFile(outputUrl, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Reviewed ${report.rawHitCount} Pixabay results: ${report.candidateCount} identity matches, ${report.pendingCandidateCount} pending.`);
console.log(`Wrote ${outputUrl.pathname}`);
