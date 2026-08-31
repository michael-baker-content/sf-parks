import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const normalizedDirectory = new URL("../data/normalized/", import.meta.url);
const configurationUrl = new URL("../data/presentation/destinations.json", import.meta.url);
const enrichmentsUrl = new URL("../data/presentation/enrichments.json", import.meta.url);
const directoryFeaturesUrl = new URL("../data/presentation/directory-features.json", import.meta.url);
const outputDirectory = new URL("../data/presentation/generated/", import.meta.url);

const labelAliases = new Map([
  ["Table Seating Area", "Picnic Area"],
  ["Indoor Recreation Area", "Indoor Recreation Area"],
  ["Restroom", "Restrooms"],
  ["Toilet", "Restrooms"],
  ["Multi-Use Paved Area", "Multi-use Paved Area"],
  ["Pickleball Courts", "Pickleball Court"],
  ["Basketball", "Basketball Court"],
  ["Rec Center", "Recreation Center"]
]);

function compareText(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), "en", { numeric: true });
}

function normalizedLabel(label) {
  return labelAliases.get(label) ?? label;
}

function slugify(value) {
  return String(value).toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function validateReviewedRecord(record, kind) {
  for (const field of ["reason", "reviewedAt", "reviewedBy", "sourceUrl"]) {
    if (!record[field]) throw new Error(`${kind} ${record.id ?? record.destinationId}: missing ${field}.`);
  }
}

function officialActions(...records) {
  const seen = new Set();
  return records.filter(Boolean).flatMap((record) => {
    if (seen.has(record.sourceUrl)) return [];
    seen.add(record.sourceUrl);
    return [{
      type: record.actionType ?? "information-page",
      url: record.sourceUrl,
      reviewedAt: record.reviewedAt,
      retrievedAt: record.retrievedAt ?? null
    }];
  });
}

export function collapseAmenities(evidence, enrichments = []) {
  const collapsed = new Map();

  for (const item of evidence) {
    const classification = item.publicClassification;
    if (!classification) continue;
    const label = normalizedLabel(classification.publicLabel);
    const key = `${classification.category}|${label}`;
    if (!collapsed.has(key)) {
      collapsed.set(key, {
        label,
        category: classification.category,
        availability: "source-listed",
        quantity: null,
        quantityStatus: "not-verified",
        evidenceCount: 0,
        evidence: []
      });
    }
    const entry = collapsed.get(key);
    entry.evidenceCount += item.count ?? 1;
    entry.evidence.push({
      sourceType: item.sourceType,
      sourceReferences: item.sourceReferences
    });
  }

  for (const enrichment of enrichments) {
    const label = normalizedLabel(enrichment.label);
    const key = `${enrichment.category}|${label}`;
    if (!collapsed.has(key)) {
      collapsed.set(key, {
        label,
        category: enrichment.category,
        availability: "official-page-listed",
        quantity: null,
        quantityStatus: "not-stated",
        evidenceCount: 0,
        evidence: []
      });
    }
    const entry = collapsed.get(key);
    entry.availability = "official-page-listed";
    entry.quantity = enrichment.quantity;
    entry.quantityStatus = enrichment.quantity === null ? "not-stated" : "official-page-verified";
    entry.evidence.push({ sourceType: "official-webpage", sourceReferences: [] });
  }

  return [...collapsed.values()].sort((a, b) => compareText(a.category, b.category) || compareText(a.label, b.label));
}

function destinationEvidence(propertyIds, facilityIds, amenities) {
  const propertySet = new Set(propertyIds);
  const facilitySet = new Set(facilityIds);
  const publicFacilities = amenities.facilities.filter((item) => propertySet.has(item.property.id));
  for (const item of publicFacilities) facilitySet.add(item.id);
  const functionalAreas = amenities.functionalAreas.filter((item) => propertySet.has(item.property.id));
  const assetSummaries = amenities.assetSummaries.filter((item) => {
    const [kind, id] = item.parent.split(":");
    return kind === "property" ? propertySet.has(id) : kind === "facility" && facilitySet.has(id);
  });
  return [...publicFacilities, ...functionalAreas, ...assetSummaries];
}

function combinedArea(properties) {
  if (properties.some((property) => !Number.isFinite(property.acres) || !Number.isFinite(property.squareFeet))) {
    return { acres: null, squareFeet: null };
  }
  return {
    acres: properties.reduce((sum, property) => sum + property.acres, 0),
    squareFeet: properties.reduce((sum, property) => sum + property.squareFeet, 0)
  };
}

function destinationFromProperty(property, amenities, enrichment = null, directoryFeature = null) {
  const id = enrichment?.destinationId ?? slugify(property.name);
  const propertyIds = enrichment?.propertyIds ?? [property.id];
  const evidence = destinationEvidence(propertyIds, [], amenities);
  return {
    id,
    publicName: enrichment?.publicName ?? property.name,
    kind: "property",
    propertyIds,
    principalFacilityIds: [],
    subplaces: [{ type: "property", id: property.id, label: property.name }],
    address: property.address,
    zipcode: property.zipcode,
    neighborhood: property.neighborhood,
    acres: property.acres,
    squareFeet: property.squareFeet,
    placeTypes: [property.propertyType].filter(Boolean),
    displayPoint: property.displayPoint,
    searchableAliases: [property.name, property.id],
    amenities: collapseAmenities(evidence, [...(enrichment?.features ?? []), ...(directoryFeature?.features ?? [])]),
    coverage: enrichment || directoryFeature ? "official-page-reviewed" : "open-data-only",
    officialActions: officialActions(enrichment, directoryFeature),
    enrichment: enrichment ? {
      sourceUrl: enrichment.sourceUrl,
      retrievedAt: enrichment.retrievedAt,
      reviewedAt: enrichment.reviewedAt,
      reason: enrichment.reason
    } : null
  };
}

export function buildDestinations({ properties, facilities, amenities, configuration, enrichments, directoryFeatures = { records: [] } }) {
  const propertyMap = new Map(properties.map((item) => [item.id, item]));
  const facilityMap = new Map(facilities.map((item) => [item.id, item]));
  const configuredPropertyIds = new Set(configuration.destinations.flatMap((item) => item.propertyIds));
  const enrichmentMap = new Map(enrichments.enrichments.map((item) => [item.destinationId, item]));
  const directoryFeatureMap = new Map(directoryFeatures.records.map((item) => [item.destinationId, item]));
  const enrichmentByProperty = new Map(
    enrichments.enrichments.filter((item) => item.propertyIds?.length === 1)
      .map((item) => [item.propertyIds[0], item])
  );

  for (const record of configuration.destinations) validateReviewedRecord(record, "destination");
  for (const record of enrichments.enrichments) validateReviewedRecord(record, "enrichment");
  for (const record of directoryFeatures.records) validateReviewedRecord(record, "directory feature enrichment");

  const output = [];
  for (const config of configuration.destinations) {
    const memberProperties = config.propertyIds.map((id) => propertyMap.get(id));
    const principalFacilities = config.principalFacilityIds.map((id) => facilityMap.get(id));
    if (memberProperties.some((item) => !item) || principalFacilities.some((item) => !item)) {
      throw new Error(`${config.id}: configured source entity was not found.`);
    }
    const enrichment = enrichmentMap.get(config.id);
    const directoryFeature = directoryFeatureMap.get(config.id);
    const evidence = destinationEvidence(config.propertyIds, config.principalFacilityIds, amenities);
    const primary = memberProperties[0];
    const area = combinedArea(memberProperties);
    output.push({
      id: config.id,
      publicName: config.publicName,
      kind: config.kind,
      propertyIds: config.propertyIds,
      principalFacilityIds: config.principalFacilityIds,
      subplaces: [
        ...memberProperties.map((item) => ({ type: "property", id: item.id, label: item.name })),
        ...principalFacilities.map((item) => ({ type: "facility", id: item.id, label: item.name }))
      ],
      address: principalFacilities[0]?.address ?? primary.address,
      zipcode: principalFacilities[0]?.zipcode ?? primary.zipcode,
      neighborhood: principalFacilities[0]?.neighborhood ?? primary.neighborhood,
      acres: area.acres,
      squareFeet: area.squareFeet,
      placeTypes: [...new Set(memberProperties.map((item) => item.propertyType).filter(Boolean))].sort(compareText),
      displayPoint: principalFacilities[0]?.displayPoint ?? primary.displayPoint,
      searchableAliases: [...new Set([
        config.publicName,
        ...config.hiddenSourceAliases,
        ...config.propertyIds,
        ...config.principalFacilityIds
      ])],
      amenities: collapseAmenities(evidence, [...(enrichment?.features ?? []), ...(directoryFeature?.features ?? [])]),
      coverage: enrichment || directoryFeature ? "official-page-reviewed" : "open-data-only",
      officialActions: officialActions(enrichment, directoryFeature, config),
      presentationReview: {
        sourceUrl: config.sourceUrl,
        reviewedAt: config.reviewedAt,
        reviewedBy: config.reviewedBy,
        reason: config.reason
      },
      enrichment: enrichment ? {
        sourceUrl: enrichment.sourceUrl,
        retrievedAt: enrichment.retrievedAt,
        reviewedAt: enrichment.reviewedAt,
        reason: enrichment.reason
      } : null
    });
  }

  for (const property of properties) {
    if (configuredPropertyIds.has(property.id)) continue;
    const destinationId = enrichmentByProperty.get(property.id)?.destinationId ?? slugify(property.name);
    output.push(destinationFromProperty(property, amenities, enrichmentByProperty.get(property.id), directoryFeatureMap.get(destinationId)));
  }

  return output.map((destination) => ({
    ...destination,
    searchableAmenityTerms: [...new Set(destination.amenities.flatMap((amenity) => [
      amenity.label,
      ...amenity.evidence.map((item) => item.sourceType)
    ]).filter(Boolean))].sort(compareText)
  })).sort((a, b) => compareText(a.publicName, b.publicName) || compareText(a.id, b.id));
}

async function loadJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

export async function buildFromFiles() {
  const [propertiesDoc, facilitiesDoc, amenities, configuration, enrichments, directoryFeatures] = await Promise.all([
    loadJson(new URL("properties.json", normalizedDirectory)),
    loadJson(new URL("facilities.json", normalizedDirectory)),
    loadJson(new URL("amenities.json", normalizedDirectory)),
    loadJson(configurationUrl),
    loadJson(enrichmentsUrl),
    loadJson(directoryFeaturesUrl)
  ]);
  const destinations = buildDestinations({
    properties: propertiesDoc.records,
    facilities: facilitiesDoc.records,
    amenities,
    configuration,
    enrichments,
    directoryFeatures
  });
  await mkdir(outputDirectory, { recursive: true });
  const outputUrl = new URL("destinations.json", outputDirectory);
  const temporaryUrl = new URL("destinations.json.tmp", outputDirectory);
  const document = {
    schemaVersion: 1,
    generatedFrom: "normalized-data-and-reviewed-presentation-configuration",
    recordCount: destinations.length,
    records: destinations
  };
  await writeFile(temporaryUrl, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  await rename(temporaryUrl, outputUrl);
  return { outputUrl, destinations };
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  try {
    const result = await buildFromFiles();
    console.log(`Built ${result.destinations.length} public destinations at ${fileURLToPath(result.outputUrl)}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
