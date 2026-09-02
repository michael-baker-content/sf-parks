import { readFile, mkdir, rename, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { geometryContainsPoint, representativeGeometryPoint } from "../src/lib/geojson-points.js";
import { distanceMiles } from "../src/lib/nearby-destinations.js";

const importsDirectory = new URL("../data/imports/", import.meta.url);
const outputDirectory = new URL("../data/normalized/", import.meta.url);
const taxonomyUrl = new URL("../data/normalization/taxonomy.json", import.meta.url);
const overridesUrl = new URL("../data/normalization/overrides.json", import.meta.url);

const sourceFiles = {
  properties: "datasf-rec-park-properties.json",
  facilities: "datasf-rec-park-facilities.json",
  functionalAreas: "datasf-rec-park-functional-areas.json",
  assets: "datasf-rec-park-assets.json"
};

function clean(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function compareText(a, b) {
  return String(a).localeCompare(String(b), "en", { numeric: true });
}

export function groupById(rows, idField) {
  const groups = new Map();
  for (const row of rows) {
    const id = clean(row[idField]);
    if (!id) continue;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(row);
  }
  return [...groups.entries()].sort(([a], [b]) => compareText(a, b));
}

export function chooseCanonical(rows, field) {
  const counts = new Map();
  for (const row of rows) {
    const value = clean(row[field]);
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || compareText(a[0], b[0]))[0]?.[0] ?? null;
}

export function fieldConflicts(rows, fields) {
  const conflicts = {};
  for (const field of fields) {
    const values = [...new Set(rows.map((row) => clean(row[field])).filter(Boolean))].sort(compareText);
    if (values.length > 1) conflicts[field] = values;
  }
  return conflicts;
}

export function isUsableCoordinatePair(latitudeValue, longitudeValue) {
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
    && !(latitude === 0 && longitude === 0);
}

export const MAX_SOURCE_SHAPE_DISTANCE_MILES = 0.5;

function displayPointReview(rows, parentPoint = null) {
  for (const row of rows) {
    const sourcePoint = isUsableCoordinatePair(row.latitude, row.longitude)
      ? { latitude: Number(row.latitude), longitude: Number(row.longitude) }
      : null;
    if (sourcePoint && (!row.shape || geometryContainsPoint(row.shape, sourcePoint))) {
      return { point: { ...sourcePoint, precision: "source-point" }, review: null };
    }
    const geometryPoint = representativeGeometryPoint(row.shape);
    if (geometryPoint) {
      const point = { latitude: geometryPoint.latitude, longitude: geometryPoint.longitude, precision: "derived-shape-point" };
      if (sourcePoint && distanceMiles(sourcePoint, point) <= MAX_SOURCE_SHAPE_DISTANCE_MILES) {
        return { point: { ...sourcePoint, precision: "source-point" }, review: null };
      }
      return {
        point,
        review: {
          reason: sourcePoint ? "source-point-outside-shape" : "missing-or-invalid-source-point",
          sourcePoint,
          replacementPoint: point,
        },
      };
    }
  }
  return { point: parentPoint ? { ...parentPoint, precision: "inherited-parent-point" } : null, review: null };
}

function exactRelationship(id, knownIds) {
  if (!id) return { status: "unresolved", id: null, method: null };
  if (knownIds.has(id)) return { status: "linked", id, method: "exact-id" };
  return { status: "unresolved", id, method: null };
}

function sourceReferences(rows, sourceId) {
  const entityIdFields = {
    "datasf-rec-park-properties": "property_id",
    "datasf-rec-park-facilities": "facility_id",
    "datasf-rec-park-functional-areas": "funcarea_id",
    "datasf-rec-park-assets": "asset_id"
  };
  const entityIdField = entityIdFields[sourceId];
  return rows.map((row) => ({
    sourceId,
    sourceRecordId: clean(row.objectid),
    sourceEntityId: clean(row[entityIdField])
  })).sort((a, b) => compareText(a.sourceRecordId, b.sourceRecordId));
}

function taxonomyEntry(type, mapping) {
  return type && mapping[type]
    ? { sourceType: type, ...mapping[type] }
    : null;
}

export function normalizeDatasets({ properties, facilities, functionalAreas, assets, taxonomy }) {
  const propertyRows = properties.map((item) => item.data);
  const facilityRows = facilities.map((item) => item.data);
  const functionalRows = functionalAreas.map((item) => item.data);
  const assetRows = assets.map((item) => item.data);

  const normalizedProperties = propertyRows
    .map((row) => {
      const acres = clean(row.acres) === null ? null : Number(row.acres);
      const sourceSquareFeet = clean(row.squarefeet) === null ? null : Number(row.squarefeet);
      const location = displayPointReview([row]);
      return {
      id: clean(row.property_id),
      name: clean(row.property_name),
      propertyType: clean(row.propertytype),
      address: clean(row.address),
      city: clean(row.city),
      state: clean(row.state),
      zipcode: clean(row.zipcode),
      neighborhood: clean(row.analysis_neighborhood),
      acres,
      squareFeet: Number.isFinite(sourceSquareFeet) ? sourceSquareFeet : Number.isFinite(acres) ? acres * 43560 : null,
      displayPoint: location.point,
      ...(location.review ? { coordinateReview: location.review } : {}),
      sourceReferences: sourceReferences([row], "datasf-rec-park-properties")
    }; })
    .sort((a, b) => compareText(a.name, b.name) || compareText(a.id, b.id));

  const propertyMap = new Map(normalizedProperties.map((item) => [item.id, item]));
  const propertyIds = new Set(propertyMap.keys());
  const facilityGroups = groupById(facilityRows, "facility_id");
  const facilityIds = new Set(facilityGroups.map(([id]) => id));

  const normalizedFacilities = facilityGroups.map(([id, rows]) => {
    const propertyId = chooseCanonical(rows, "property_id");
    const relationship = exactRelationship(propertyId, propertyIds);
    const type = chooseCanonical(rows, "facility_type");
    const location = displayPointReview(rows, relationship.status === "linked" ? propertyMap.get(propertyId)?.displayPoint : null);
    return {
      id,
      name: chooseCanonical(rows, "facility_name"),
      sourceType: type,
      publicClassification: taxonomyEntry(type, taxonomy.facilityTypes),
      property: relationship,
      address: chooseCanonical(rows, "address"),
      zipcode: chooseCanonical(rows, "zipcode"),
      neighborhood: chooseCanonical(rows, "analysis_neighborhood"),
      displayPoint: location.point,
      ...(location.review ? { coordinateReview: location.review } : {}),
      componentCount: rows.length,
      conflicts: fieldConflicts(rows, ["facility_name", "facility_type", "property_id", "property_name", "address"]),
      sourceReferences: sourceReferences(rows, "datasf-rec-park-facilities")
    };
  }).sort((a, b) => compareText(a.name, b.name) || compareText(a.id, b.id));

  const facilityMap = new Map(normalizedFacilities.map((item) => [item.id, item]));
  const normalizedFunctionalAreas = groupById(functionalRows, "funcarea_id").map(([id, rows]) => {
    const propertyId = chooseCanonical(rows, "property_id");
    const facilityId = chooseCanonical(rows, "facility_id");
    const type = chooseCanonical(rows, "functional_area_type");
    const facilityRelationship = exactRelationship(facilityId, facilityIds);
    const parentPoint = facilityRelationship.status === "linked"
      ? facilityMap.get(facilityId)?.displayPoint
      : propertyMap.get(propertyId)?.displayPoint;
    const location = displayPointReview(rows, parentPoint);
    return {
      id,
      name: chooseCanonical(rows, "tma_name") ?? chooseCanonical(rows, "facility_name") ?? type,
      sourceType: type,
      publicClassification: taxonomyEntry(type, taxonomy.functionalAreaTypes),
      property: exactRelationship(propertyId, propertyIds),
      facility: facilityRelationship,
      displayPoint: location.point,
      ...(location.review ? { coordinateReview: location.review } : {}),
      componentCount: rows.length,
      conflicts: fieldConflicts(rows, ["tma_name", "functional_area_type", "facility_id", "property_id"]),
      sourceReferences: sourceReferences(rows, "datasf-rec-park-functional-areas")
    };
  }).sort((a, b) => compareText(a.name, b.name) || compareText(a.id, b.id));

  const assetSummaries = new Map();
  for (const row of assetRows) {
    const type = clean(row.asset_type);
    const classification = taxonomyEntry(type, taxonomy.assetTypes);
    if (!classification) continue;
    const propertyId = clean(row.property_id);
    const facilityId = clean(row.facility_id);
    const parentKey = facilityId && facilityIds.has(facilityId)
      ? `facility:${facilityId}`
      : propertyId && propertyIds.has(propertyId)
        ? `property:${propertyId}`
        : "unresolved";
    const key = `${parentKey}|${classification.publicLabel}`;
    if (!assetSummaries.has(key)) {
      assetSummaries.set(key, {
        id: key,
        parent: parentKey,
        sourceType: type,
        publicClassification: classification,
        count: 0,
        sourceReferences: []
      });
    }
    const summary = assetSummaries.get(key);
    summary.count += 1;
    summary.sourceReferences.push(...sourceReferences([row], "datasf-rec-park-assets"));
  }

  const publicFunctionalAreas = normalizedFunctionalAreas.filter((item) => item.publicClassification);
  const publicFacilities = normalizedFacilities.filter((item) => item.publicClassification);
  const publicAssets = [...assetSummaries.values()].sort((a, b) => compareText(a.id, b.id));

  const report = {
    schemaVersion: 1,
    generatedAt: null,
    counts: {
      properties: normalizedProperties.length,
      facilities: normalizedFacilities.length,
      publicFacilities: publicFacilities.length,
      functionalAreas: normalizedFunctionalAreas.length,
      publicFunctionalAreas: publicFunctionalAreas.length,
      publicAssetSummaries: publicAssets.length
    },
    unresolvedRelationships: {
      facilitiesWithoutProperty: normalizedFacilities.filter((item) => item.property.status !== "linked").map((item) => item.id),
      functionalAreasWithoutProperty: normalizedFunctionalAreas.filter((item) => item.property.status !== "linked").map((item) => item.id),
      functionalAreasWithoutFacility: normalizedFunctionalAreas.filter((item) => item.facility.status !== "linked").map((item) => item.id)
    },
    conflicts: {
      facilities: normalizedFacilities.filter((item) => Object.keys(item.conflicts).length).map((item) => ({ id: item.id, conflicts: item.conflicts })),
      functionalAreas: normalizedFunctionalAreas.filter((item) => Object.keys(item.conflicts).length).map((item) => ({ id: item.id, conflicts: item.conflicts }))
    },
    coordinateCorrections: {
      properties: normalizedProperties.filter((item) => item.coordinateReview).map((item) => ({ id: item.id, name: item.name, ...item.coordinateReview })),
      facilities: normalizedFacilities.filter((item) => item.coordinateReview).map((item) => ({ id: item.id, name: item.name, ...item.coordinateReview })),
      functionalAreas: normalizedFunctionalAreas.filter((item) => item.coordinateReview).map((item) => ({ id: item.id, name: item.name, ...item.coordinateReview })),
    },
    unmappedPublicCandidates: {
      facilityTypes: [...new Set(normalizedFacilities.filter((item) => !item.publicClassification).map((item) => item.sourceType).filter(Boolean))].sort(compareText),
      functionalAreaTypes: [...new Set(normalizedFunctionalAreas.filter((item) => !item.publicClassification).map((item) => item.sourceType).filter(Boolean))].sort(compareText)
    }
  };

  return {
    properties: normalizedProperties,
    facilities: normalizedFacilities,
    amenities: {
      facilities: publicFacilities,
      functionalAreas: publicFunctionalAreas,
      assetSummaries: publicAssets
    },
    report
  };
}

async function loadJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

async function writeJsonAtomically(name, value) {
  await mkdir(outputDirectory, { recursive: true });
  const outputUrl = new URL(name, outputDirectory);
  const temporaryUrl = new URL(`${name}.tmp`, outputDirectory);
  await writeFile(temporaryUrl, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryUrl, outputUrl);
  return outputUrl;
}

export async function normalizeImports() {
  const [propertySnapshot, facilitySnapshot, functionalSnapshot, assetSnapshot, taxonomy, overrides] = await Promise.all([
    loadJson(new URL(sourceFiles.properties, importsDirectory)),
    loadJson(new URL(sourceFiles.facilities, importsDirectory)),
    loadJson(new URL(sourceFiles.functionalAreas, importsDirectory)),
    loadJson(new URL(sourceFiles.assets, importsDirectory)),
    loadJson(taxonomyUrl),
    loadJson(overridesUrl)
  ]);
  if (overrides.overrides.length) {
    throw new Error("Override application is not implemented; refusing to ignore configured overrides.");
  }

  const result = normalizeDatasets({
    properties: propertySnapshot.records,
    facilities: facilitySnapshot.records,
    functionalAreas: functionalSnapshot.records,
    assets: assetSnapshot.records,
    taxonomy
  });
  result.report.inputs = {
    propertiesRetrievedAt: propertySnapshot.import.retrievedAt,
    facilitiesRetrievedAt: facilitySnapshot.import.retrievedAt,
    functionalAreasRetrievedAt: functionalSnapshot.import.retrievedAt,
    assetsRetrievedAt: assetSnapshot.import.retrievedAt,
    sources: [propertySnapshot, facilitySnapshot, functionalSnapshot, assetSnapshot].map((snapshot) => ({
      sourceId: snapshot.source.id,
      retrievedAt: snapshot.import.retrievedAt
    }))
  };
  result.report.generatedAt = [
    propertySnapshot.import.retrievedAt,
    facilitySnapshot.import.retrievedAt,
    functionalSnapshot.import.retrievedAt,
    assetSnapshot.import.retrievedAt
  ].sort().at(-1);

  const outputs = await Promise.all([
    writeJsonAtomically("properties.json", { schemaVersion: 1, records: result.properties }),
    writeJsonAtomically("facilities.json", { schemaVersion: 1, records: result.facilities }),
    writeJsonAtomically("amenities.json", { schemaVersion: 1, ...result.amenities }),
    writeJsonAtomically("taxonomy.json", taxonomy),
    writeJsonAtomically("normalization-report.json", result.report)
  ]);
  return { outputs, report: result.report };
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  try {
    const result = await normalizeImports();
    console.log(`Normalized ${result.report.counts.properties} properties, ${result.report.counts.facilities} facilities, and ${result.report.counts.functionalAreas} functional areas.`);
    console.log(`Wrote ${result.outputs.length} files to ${fileURLToPath(outputDirectory)}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
