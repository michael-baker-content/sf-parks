import { readFile, mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const destinationsUrl = new URL("../data/presentation/generated/destinations.json", import.meta.url);
const manifestUrl = new URL("../data/media/media-manifest.json", import.meta.url);
const reviewsUrl = new URL("../data/media/localwiki-image-reviews.json", import.meta.url);
const outputUrl = new URL("../data/media/generated/localwiki-image-candidates.json", import.meta.url);
const apiRoot = "https://localwiki.org/api/v4";
const userAgent = "SF Parks Explorer LocalWiki image review (local build-time discovery)";
const delayMs = 750;
const reviewedPageOverrides = new Map([
  ["pioneer park", "telegraph-hill-pioneer-park"]
]);

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(recreation|rec) center\b/g, "")
    .replace(/\bplayground\b/g, "park")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getJson(url, maximumAttempts = 3) {
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    const response = await fetch(url, { headers: { accept: "application/json", "user-agent": userAgent } });
    if (response.ok) return response.json();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === maximumAttempts) {
      throw new Error(`LocalWiki request failed (${response.status}): ${url}`);
    }
    await sleep(attempt * 2000);
  }
  throw new Error(`LocalWiki request failed: ${url}`);
}

async function getAllPages(url, maximumPages = 20) {
  const results = [];
  let next = url.toString();
  let pageCount = 0;
  while (next && pageCount < maximumPages) {
    if (pageCount > 0) await sleep(delayMs);
    const document = await getJson(next);
    results.push(...(document.results ?? []));
    next = document.next;
    pageCount += 1;
  }
  return { results, pageCount, truncated: Boolean(next) };
}

function destinationNames(destination) {
  return new Set([
    destination.publicName,
    ...(destination.searchableAliases ?? []),
    destination.id.replaceAll("-", " ")
  ].map(normalize).filter(Boolean));
}

function extractReferencedNames(content) {
  return [...String(content ?? "").matchAll(/_files\/([^"?#<]+)/gi)]
    .map((match) => decodeURIComponent(match[1]).replaceAll("+", " "));
}

function extractCaption(content, fileName) {
  const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(content ?? "").match(new RegExp(`_files/${escaped}[\\s\\S]{0,600}?class=["']image_caption["'][^>]*>([\\s\\S]*?)<\\/span>`, "i"));
  return match?.[1]
    ?.replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim() || null;
}

const requestedLimit = Number.parseInt(process.argv[2] ?? "20", 10);
const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 50) : 20;
const destinationsDocument = JSON.parse(await readFile(destinationsUrl, "utf8"));
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const reviewDocument = JSON.parse(await readFile(reviewsUrl, "utf8"));
const reviewsByApiUrl = new Map(reviewDocument.reviews.map((review) => [review.apiUrl, review]));
const publishedIds = new Set(manifest.images.map((image) => image.destinationId));

const pageUrl = new URL(`${apiRoot}/pages/`);
pageUrl.search = new URLSearchParams({
  region__slug: "sf",
  limit: "100",
  fields: "url,name,slug,content"
});
const pageCollection = await getAllPages(pageUrl);
if (pageCollection.truncated) throw new Error("LocalWiki page discovery exceeded its 20-request safety limit.");
const pages = pageCollection.results;
const candidatesByName = new Map();

for (const destination of destinationsDocument.records) {
  if (publishedIds.has(destination.id)) continue;
  for (const name of destinationNames(destination)) {
    if (!candidatesByName.has(name)) candidatesByName.set(name, []);
    candidatesByName.get(name).push(destination);
  }
}

const matches = pages
  .flatMap((page) => {
    const overrideId = reviewedPageOverrides.get(normalize(page.slug));
    const overrideDestination = overrideId
      ? destinationsDocument.records.find((destination) => destination.id === overrideId && !publishedIds.has(destination.id))
      : null;
    const destinations = overrideDestination ? [overrideDestination] : (candidatesByName.get(normalize(page.slug)) ?? []);
    return destinations.map((destination) => ({ page, destination }));
  })
  .filter(({ page }) => extractReferencedNames(page.content).length > 0)
  .sort((left, right) => (right.destination.amenities?.length ?? 0) - (left.destination.amenities?.length ?? 0))
  .slice(0, limit);

const reviewedCandidates = [];
for (const { page, destination } of matches) {
  const filesUrl = new URL(`${apiRoot}/files/`);
  filesUrl.search = new URLSearchParams({ region__slug: "sf", slug: page.slug, limit: "100" });
  await sleep(delayMs);
  const files = (await getJson(filesUrl)).results ?? [];
  const referencedNames = new Set(extractReferencedNames(page.content).map((name) => name.toLowerCase()));
  reviewedCandidates.push({
    destinationId: destination.id,
    destinationName: destination.publicName,
    amenityCount: destination.amenities?.length ?? 0,
    localwikiPageName: page.name,
    localwikiPageUrl: `https://localwiki.org/sf/${encodeURIComponent(page.name.replaceAll(" ", "_"))}`,
    localwikiApiUrl: page.url,
    files: files
      .filter((file) => referencedNames.has(file.name.toLowerCase()))
      .map((file) => {
        const review = reviewsByApiUrl.get(file.url);
        return {
          name: file.name,
          fileUrl: file.file,
          apiUrl: file.url,
          caption: extractCaption(page.content, file.name),
          reviewStatus: review?.status ?? "pending",
          reviewNotes: review?.reason ?? "Confirm the subject, caption-level rights exception, contributor history, dimensions, and visual fit."
        };
      })
  });
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "LocalWiki read API",
  sourceRegion: "sf",
  sourcePagesScanned: pages.length,
  sourcePageRequests: pageCollection.pageCount,
  publicationStatus: "candidate-review-only",
  policy: "docs/imagery-enrichment-policy.md",
  pageMatchesReviewed: reviewedCandidates.length,
  fileCandidateCount: reviewedCandidates.reduce((sum, candidate) => sum + candidate.files.length, 0),
  candidates: reviewedCandidates
};

await mkdir(new URL("../data/media/generated/", import.meta.url), { recursive: true });
await writeFile(outputUrl, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Found ${report.fileCandidateCount} LocalWiki image candidates across ${report.pageMatchesReviewed} matched destinations.`);
console.log(`Wrote ${outputUrl.pathname}`);
