import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const destinationsUrl = new URL("../data/presentation/generated/destinations.json", import.meta.url);
const configurationUrl = new URL("../data/search/search-filters.json", import.meta.url);
const outputDirectory = new URL("../data/search/generated/", import.meta.url);

export function normalizeSearchText(value) {
  return String(value ?? "").normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugify(value) {
  return normalizeSearchText(value).replace(/\s+/g, "-");
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

export function activityMatches(destination, activity) {
  const labels = new Set(destination.amenities.map((item) => item.label));
  const categories = new Set(destination.amenities.map((item) => item.category));
  const checks = [
    ...(activity.amenityLabels ?? []).map((label) => labels.has(label)),
    ...(activity.categories ?? []).map((category) => categories.has(category))
  ];
  return activity.match === "all" ? checks.every(Boolean) : checks.some(Boolean);
}

export function createSearchRecord(destination, configuration) {
  const activityIds = configuration.activities
    .filter((activity) => activityMatches(destination, activity))
    .map((activity) => activity.id);
  const amenityLabels = uniqueSorted(destination.amenities.map((item) => item.label));
  const amenityCategories = uniqueSorted(destination.amenities.map((item) => item.category));
  const aliases = uniqueSorted(destination.searchableAliases ?? []);
  const amenityTerms = uniqueSorted(destination.searchableAmenityTerms ?? []);
  const placeTypes = uniqueSorted([
    ...(destination.placeTypes ?? []),
    ...(amenityLabels.includes("Recreation Center") ? ["Recreation Center"] : [])
  ]);
  const neighborhoods = uniqueSorted(String(destination.neighborhood ?? "")
    .split(",").map((item) => item.trim()));

  return {
    id: destination.id,
    publicName: destination.publicName,
    normalized: {
      publicName: normalizeSearchText(destination.publicName),
      aliases: aliases.map(normalizeSearchText),
      neighborhood: normalizeSearchText(destination.neighborhood),
      address: normalizeSearchText(destination.address),
      zipcode: normalizeSearchText(destination.zipcode),
      amenityTerms: amenityTerms.map(normalizeSearchText),
      combined: normalizeSearchText([
        destination.publicName,
        ...aliases,
        destination.neighborhood,
        destination.address,
        destination.zipcode,
        ...amenityTerms
      ].join(" "))
    },
    filters: {
      activityIds,
      amenityIds: amenityLabels.map(slugify),
      amenityLabels,
      amenityCategories,
      neighborhoods,
      neighborhoodIds: neighborhoods.map(slugify),
      zipcode: destination.zipcode ?? null,
      placeTypes,
      placeTypeIds: placeTypes.map(slugify),
      coverage: destination.coverage
    },
    display: {
      neighborhood: destination.neighborhood,
      address: destination.address,
      zipcode: destination.zipcode,
      displayPoint: destination.displayPoint,
      coverage: destination.coverage
    }
  };
}

export function buildSearchIndex(destinations, configuration) {
  const records = destinations.map((item) => createSearchRecord(item, configuration));
  const facets = {
    activities: configuration.activities.map((activity) => ({
      id: activity.id,
      label: activity.label,
      count: records.filter((record) => record.filters.activityIds.includes(activity.id)).length
    })),
    amenities: [...new Set(records.flatMap((record) => record.filters.amenityLabels))]
      .sort().map((label) => ({
        id: slugify(label), label,
        count: records.filter((record) => record.filters.amenityLabels.includes(label)).length
      })),
    neighborhoods: [...new Set(records.flatMap((record) => record.filters.neighborhoods))]
      .sort().map((label) => ({
        id: slugify(label), label,
        count: records.filter((record) => record.filters.neighborhoods.includes(label)).length
      })),
    zipcodes: [...new Set(records.map((record) => record.filters.zipcode).filter(Boolean))]
      .sort().map((label) => ({
        id: label, label,
        count: records.filter((record) => record.filters.zipcode === label).length
      })),
    placeTypes: [...new Set(records.flatMap((record) => record.filters.placeTypes))]
      .sort().map((label) => ({
        id: slugify(label), label,
        count: records.filter((record) => record.filters.placeTypes.includes(label)).length
      })),
    coverage: ["official-page-reviewed", "open-data-only"].map((id) => ({
      id,
      count: records.filter((record) => record.filters.coverage === id).length
    }))
  };
  return { records, facets };
}

async function loadJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

export async function buildFromFiles() {
  const [destinationDocument, configuration] = await Promise.all([
    loadJson(destinationsUrl), loadJson(configurationUrl)
  ]);
  const index = buildSearchIndex(destinationDocument.records, configuration);
  await mkdir(outputDirectory, { recursive: true });
  const outputUrl = new URL("search-index.json", outputDirectory);
  const temporaryUrl = new URL("search-index.json.tmp", outputDirectory);
  const document = {
    schemaVersion: 1,
    recordCount: index.records.length,
    filterLogic: configuration.filterLogic,
    ...index
  };
  await writeFile(temporaryUrl, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  await rename(temporaryUrl, outputUrl);
  return { outputUrl, document };
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  try {
    const result = await buildFromFiles();
    console.log(`Built a ${result.document.recordCount}-destination search index at ${fileURLToPath(result.outputUrl)}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
