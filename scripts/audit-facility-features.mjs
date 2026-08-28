import { mkdir, readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

const discoveryUrl = new URL("../data/content/generated/evergreen-source-discovery.json", import.meta.url);
const destinationsUrl = new URL("../data/presentation/generated/destinations.json", import.meta.url);
const outputUrl = new URL("../data/content/generated/facility-feature-audit.json", import.meta.url);

const equivalentLabels = new Map(Object.entries({
  "Athletic Field": "Athletic Field",
  "Baseball / Softball": "Ball Field",
  "Baseball Diamond": "Baseball Diamond",
  "Basketball": "Basketball Court",
  "BBQ Grills": "Grill",
  "Benches/Seating": "Bench",
  "Bocce": "Bocce Ball Court",
  "Climbing Wall": "Climbing Wall",
  "Clubhouse": "Clubhouse",
  "Community Garden": "Community Garden",
  "Community Room": "Community Rooms",
  "Community Room(s)": "Community Rooms",
  "Dog Play Area (Along Wawona St.)": "Dog Play Area",
  "Fitness Equipment aka \"Fitness Zone\"": "Adult Fitness Area",
  "Handball": "Handball Court",
  "Nature Exploration Area (NEA)": "Nature Exploration Area",
  "Natural Area": "Natural Area",
  "Off-Leash Dog Play Area": "Dog Play Area",
  "Outdoor Basketball Court": "Basketball Court",
  "Outdoor Basketball Hoops": "Basketball Court",
  "Outdoor Fitness Equipment": "Adult Fitness Area",
  "Pickleball (Indoor)": "Pickleball (Indoor)",
  "Pickleball (Outdoor)": "Pickleball Court",
  "Picnic Area": "Picnic Area",
  "Ping Pong": "Ping Pong",
  "Playground": "Children's Play Area",
  "Public Art": "Public Art",
  "Restrooms": "Restrooms",
  "Skate Park": "Skatepark",
  "Soccer": "Soccer Field",
  "Soccer Pitch": "Soccer Field",
  "Stadium": "Stadium",
  "Swimming Pool": "Swimming Pool",
  "Tennis": "Tennis Court",
  "Volleyball": "Volleyball Court"
}));

const temporaryPattern = /under renovation/i;
const operationalPattern = /available for rentals|open gym hours|during events only|membership|classes/i;
const accessibilityPattern = /^accessible\b|^ada pathways$|^elevator\b/i;
const siteSpecificPattern = /supervisor harvey milk|along wawona/i;

export function classifyFeature(label) {
  if (temporaryPattern.test(label)) return { status: "exclude-temporary", mapsTo: null };
  if (operationalPattern.test(label)) return { status: "exclude-operational", mapsTo: null };
  if (accessibilityPattern.test(label)) return { status: "separate-accessibility-review", mapsTo: null };
  if (siteSpecificPattern.test(label)) return { status: "site-specific-review", mapsTo: equivalentLabels.get(label) ?? null };
  if (equivalentLabels.has(label)) return { status: "existing-equivalent", mapsTo: equivalentLabels.get(label) };
  if (label === "Other") return { status: "exclude-unspecific", mapsTo: null };
  return { status: "candidate-new-feature", mapsTo: null };
}

export async function buildFeatureAudit() {
  const [discovery, destinations] = await Promise.all([
    readFile(discoveryUrl, "utf8").then(JSON.parse),
    readFile(destinationsUrl, "utf8").then(JSON.parse)
  ]);
  const destinationMap = new Map(destinations.records.map((record) => [record.id, record]));
  const features = new Map();
  for (const record of discovery.records.filter((item) => item.status === "matched")) {
    const existing = new Set((destinationMap.get(record.destinationId)?.amenities ?? []).map((item) => item.label));
    for (const feature of record.match.features ?? []) {
      const classification = classifyFeature(feature.label);
      if (!features.has(feature.label)) features.set(feature.label, { id: feature.id, label: feature.label, ...classification, destinationIds: [], missingDestinationIds: [], alreadyPresentCount: 0 });
      const summary = features.get(feature.label);
      summary.destinationIds.push(record.destinationId);
      if (summary.mapsTo && existing.has(summary.mapsTo)) summary.alreadyPresentCount += 1;
      else summary.missingDestinationIds.push(record.destinationId);
    }
  }
  const records = [...features.values()].map((feature) => ({
    ...feature,
    destinationCount: feature.destinationIds.length,
    missingFromExistingCount: feature.destinationIds.length - feature.alreadyPresentCount,
    destinationIds: feature.destinationIds.sort(),
    missingDestinationIds: feature.missingDestinationIds.sort()
  })).sort((a, b) => b.destinationCount - a.destinationCount || a.label.localeCompare(b.label));
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    matchedDestinationCount: discovery.records.filter((item) => item.status === "matched").length,
    directoryFeatureCatalogCount: discovery.directoryFeatureCatalog?.length ?? 0,
    unobservedCatalogFeatures: (discovery.directoryFeatureCatalog ?? []).filter((feature) => feature.assignedDirectoryEntryCount === 0),
    summary: Object.fromEntries([...new Set(records.map((item) => item.status))].sort().map((status) => [status, records.filter((item) => item.status === status).length])),
    records
  };
  await mkdir(new URL("../data/content/generated/", import.meta.url), { recursive: true });
  await writeFile(outputUrl, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  try {
    const report = await buildFeatureAudit();
    console.log(`Audited ${report.records.length} assigned features across ${report.matchedDestinationCount} matched destinations (${report.directoryFeatureCatalogCount} options in the directory catalog).`);
    console.log(Object.entries(report.summary).map(([status, count]) => `${status}: ${count}`).join("\n"));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
