import { mkdir, readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { buildDestinations } from "./build-destinations.mjs";

const auditUrl = new URL("../data/content/generated/facility-feature-audit.json", import.meta.url);
const discoveryUrl = new URL("../data/content/generated/evergreen-source-discovery.json", import.meta.url);
const outputUrl = new URL("../data/presentation/directory-features.json", import.meta.url);
const normalizedDirectory = new URL("../data/normalized/", import.meta.url);

const fallbackCategories = new Map([
  ["Athletic Field", "sports"], ["Baseball Diamond", "sports"], ["Basketball Court", "sports"],
  ["Bocce Ball Court", "sports"], ["Children's Play Area", "playgrounds"],
  ["Community Rooms", "recreation-centers"], ["Nature Exploration Area", "playgrounds"],
  ["Natural Area", "gardens-nature"], ["Picnic Area", "picnic"], ["Public Art", "arts-culture"],
  ["Restrooms", "visitor-services"], ["Parking", "visitor-services"], ["Seating", "visitor-services"],
  ["Trail", "gardens-nature"], ["Bay Views", "gardens-nature"], ["Gymnasium", "recreation-centers"],
  ["Lawn Area", "gardens-nature"], ["Pathways", "gardens-nature"],
  ["Amphitheater", "arts-culture"], ["Concert Meadow", "arts-culture"], ["Native Plantings", "gardens-nature"]
]);

const approvedNewFeatureMappings = new Map([
  ["Parking", "Parking"],
  ["Seating", "Seating"],
  ["Trail", "Trail"],
  ["Bay Views", "Bay Views"],
  ["Panoramic Bay Views", "Bay Views"],
  ["Gymnasium", "Gymnasium"],
  ["Lawn Area", "Lawn Area"],
  ["Pathways", "Pathways"],
  ["Amphitheater", "Amphitheater"],
  ["Concert Meadow", "Concert Meadow"],
  ["Native Plantings", "Native Plantings"]
]);

export function publicationMapping(feature) {
  if (feature.status === "existing-equivalent" && feature.mapsTo) return feature.mapsTo;
  if (feature.status === "candidate-new-feature") return approvedNewFeatureMappings.get(feature.label) ?? null;
  return null;
}

export async function buildDirectoryFeatureEnrichments() {
  const [audit, discovery, propertiesDoc, facilitiesDoc, amenities, configuration, enrichments] = await Promise.all([
    readFile(auditUrl, "utf8").then(JSON.parse),
    readFile(discoveryUrl, "utf8").then(JSON.parse),
    readFile(new URL("properties.json", normalizedDirectory), "utf8").then(JSON.parse),
    readFile(new URL("facilities.json", normalizedDirectory), "utf8").then(JSON.parse),
    readFile(new URL("amenities.json", normalizedDirectory), "utf8").then(JSON.parse),
    readFile(new URL("../data/presentation/destinations.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/presentation/enrichments.json", import.meta.url), "utf8").then(JSON.parse)
  ]);
  const baselineDestinations = buildDestinations({
    properties: propertiesDoc.records,
    facilities: facilitiesDoc.records,
    amenities,
    configuration,
    enrichments,
    directoryFeatures: { records: [] }
  });
  const baselineMap = new Map(baselineDestinations.map((record) => [record.id, new Set(record.amenities.map((amenity) => amenity.label))]));
  const matchMap = new Map(discovery.records.filter((record) => record.status === "matched").map((record) => [record.destinationId, record.match]));
  const categoryMap = new Map(fallbackCategories);
  for (const destination of baselineDestinations) {
    for (const amenity of destination.amenities) if (!categoryMap.has(amenity.label)) categoryMap.set(amenity.label, amenity.category);
  }
  const records = new Map();
  for (const feature of audit.records) {
    const publicLabel = publicationMapping(feature);
    if (!publicLabel) continue;
    const category = categoryMap.get(publicLabel);
    if (!category) throw new Error(`No public category is configured for ${publicLabel}.`);
    for (const destinationId of feature.destinationIds) {
      if (baselineMap.get(destinationId)?.has(publicLabel)) continue;
      const match = matchMap.get(destinationId);
      if (!match) throw new Error(`${destinationId}: matched directory source was not found.`);
      if (!records.has(destinationId)) records.set(destinationId, {
        destinationId,
        features: [],
        sourceUrl: match.url,
        retrievedAt: discovery.generatedAt.slice(0, 10),
        reviewedAt: "2026-08-27",
        reviewedBy: "project-content-review",
        reason: "Stable CivicPlus directory features mapped to a reviewed public amenity label; quantities and accessibility are not inferred."
      });
      records.get(destinationId).features.push({
        sourceFeatureId: feature.id,
        sourceLabel: feature.label,
        label: publicLabel,
        category,
        quantity: null
      });
    }
  }
  const document = {
    schemaVersion: 1,
    source: "SF Recreation and Parks CivicPlus public facility directory",
    sourceDirectoryUrl: "https://www.sfrecpark.org/Facilities?clear=True",
    records: [...records.values()].map((record) => ({
      ...record,
      features: record.features.sort((a, b) => a.label.localeCompare(b.label))
    })).sort((a, b) => a.destinationId.localeCompare(b.destinationId))
  };
  await mkdir(new URL("../data/presentation/", import.meta.url), { recursive: true });
  await writeFile(outputUrl, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  return document;
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  try {
    const document = await buildDirectoryFeatureEnrichments();
    console.log(`Wrote ${document.records.reduce((sum, record) => sum + record.features.length, 0)} reviewed feature assignments across ${document.records.length} destinations.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
