import { mkdir, readFile, writeFile } from "node:fs/promises";

const destinationsUrl = new URL("../data/presentation/generated/destinations.json", import.meta.url);
const manifestUrl = new URL("../data/media/media-manifest.json", import.meta.url);
const localwikiReviewsUrl = new URL("../data/media/localwiki-image-reviews.json", import.meta.url);
const pixabayReviewsUrl = new URL("../data/media/pixabay-image-reviews.json", import.meta.url);
const outputDirectoryUrl = new URL("../data/media/generated/", import.meta.url);
const jsonOutputUrl = new URL("image-coverage-report.json", outputDirectoryUrl);
const markdownOutputUrl = new URL("image-coverage-report.md", outputDirectoryUrl);

const lowInformationTypes = new Set(["Other Non-Park Property", "Library", "Concession"]);
const visuallyUsefulAmenities = [
  "Children's Play Area", "Play Structure", "Dog Play Area", "Community Garden", "Picnic Area",
  "Swimming Pool", "Ball Field", "Baseball Field", "Softball Field", "Soccer Field", "Multi-Use Turf",
  "Basketball Court", "Tennis Court", "Pickleball Court", "Tennis/Pickleball Court", "Adult Fitness Area",
  "Recreation Center", "Arts/Activity Center", "Clubhouse", "Trail", "Lake", "Natural Area"
];
const visualAmenityOrder = new Map(visuallyUsefulAmenities.map((label, index) => [label, index]));

function reviewSummary(reviews) {
  return reviews.reduce((summary, review) => {
    const group = review.status.startsWith("rejected") ? "rejected" : review.status.startsWith("held") ? "held" : review.status.startsWith("deferred") ? "deferred" : review.status.startsWith("published") ? "published" : "other";
    summary[group] += 1;
    return summary;
  }, { held: 0, rejected: 0, deferred: 0, published: 0, other: 0 });
}

function shotSuggestions(destination) {
  const amenityLabels = new Set((destination.amenities ?? []).map((amenity) => amenity.label));
  const features = [...amenityLabels]
    .filter((label) => visualAmenityOrder.has(label))
    .sort((left, right) => visualAmenityOrder.get(left) - visualAmenityOrder.get(right))
    .slice(0, 3);
  return [
    "Horizontal establishing view of the destination's grounds and visitor experience",
    ...features.map((feature) => `Wide view showing the ${feature.toLowerCase()} in its park context`),
    "Entrance or identifying sign, if one is available"
  ];
}

function isWithinSanFrancisco(destination) {
  if (String(destination.zipcode ?? "").startsWith("941")) return true;
  const point = destination.displayPoint;
  return Boolean(point && point.latitude >= 37.6 && point.latitude <= 37.9 && point.longitude >= -122.55 && point.longitude <= -122.3);
}

function priorityScore(destination, imageCount, reviews) {
  const amenityCount = destination.amenities?.length ?? 0;
  const evidenceCount = (destination.amenities ?? []).reduce((sum, amenity) => sum + (amenity.evidenceCount ?? 0), 0);
  const base = imageCount === 0 ? 100 : imageCount === 1 ? 30 : 0;
  const amenityValue = Math.min(amenityCount, 20) * 4;
  const evidenceValue = Math.min(evidenceCount, 40) * 0.5;
  const officialValue = destination.officialActions?.length ? 8 : 0;
  const heldValue = reviews.some((review) => review.status.startsWith("held")) ? 8 : 0;
  const typePenalty = (destination.placeTypes ?? []).every((type) => lowInformationTypes.has(type)) ? 60 : 0;
  const locationPenalty = isWithinSanFrancisco(destination) ? 0 : 120;
  return Math.round((base + amenityValue + evidenceValue + officialValue + heldValue - typePenalty - locationPenalty) * 10) / 10;
}

const destinations = JSON.parse(await readFile(destinationsUrl, "utf8")).records;
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const localwikiReviews = JSON.parse(await readFile(localwikiReviewsUrl, "utf8")).reviews;
const pixabayReviews = JSON.parse(await readFile(pixabayReviewsUrl, "utf8")).reviews;
const allReviews = [...localwikiReviews, ...pixabayReviews];
const imagesByDestination = new Map();
const reviewsByDestination = new Map();

for (const image of manifest.images) {
  const images = imagesByDestination.get(image.destinationId) ?? [];
  images.push(image);
  imagesByDestination.set(image.destinationId, images);
}
for (const review of allReviews) {
  const reviews = reviewsByDestination.get(review.destinationId) ?? [];
  reviews.push(review);
  reviewsByDestination.set(review.destinationId, reviews);
}

const records = destinations.map((destination) => {
  const images = (imagesByDestination.get(destination.id) ?? []).sort((left, right) => left.position - right.position);
  const reviews = reviewsByDestination.get(destination.id) ?? [];
  const score = priorityScore(destination, images.length, reviews);
  return {
    destinationId: destination.id,
    publicName: destination.publicName,
    neighborhood: destination.neighborhood,
    zipcode: destination.zipcode,
    address: destination.address,
    displayPoint: destination.displayPoint,
    locationScope: isWithinSanFrancisco(destination) ? "san-francisco" : "outside-san-francisco",
    placeTypes: destination.placeTypes,
    amenityCount: destination.amenities?.length ?? 0,
    evidenceCount: (destination.amenities ?? []).reduce((sum, amenity) => sum + (amenity.evidenceCount ?? 0), 0),
    imageCount: images.length,
    coverageStatus: images.length === 0 ? "placeholder-only" : images.length === 1 ? "one-approved-image" : "multiple-approved-images",
    leadImagePath: images[0]?.localPath ?? "/media/park-image-placeholder.png",
    acquisitionPriorityScore: score,
    acquisitionPriority: images.length > 0 ? (images.length === 1 ? "secondary" : "covered") : score >= 150 ? "highest" : score >= 120 ? "high" : score >= 100 ? "standard" : "low",
    candidateReviewHistory: reviewSummary(reviews),
    shotSuggestions: images.length === 0 ? shotSuggestions(destination) : []
  };
}).sort((left, right) => right.acquisitionPriorityScore - left.acquisitionPriorityScore || left.publicName.localeCompare(right.publicName));

const neighborhoodMap = new Map();
for (const record of records.filter((record) => record.imageCount === 0)) {
  const neighborhood = record.neighborhood || "Neighborhood not listed";
  const summary = neighborhoodMap.get(neighborhood) ?? { neighborhood, destinationCount: 0, highestPriorityCount: 0, totalAmenities: 0, topDestinations: [] };
  summary.destinationCount += 1;
  summary.totalAmenities += record.amenityCount;
  if (record.acquisitionPriority === "highest") summary.highestPriorityCount += 1;
  summary.topDestinations.push({ destinationId: record.destinationId, publicName: record.publicName, amenityCount: record.amenityCount, score: record.acquisitionPriorityScore });
  neighborhoodMap.set(neighborhood, summary);
}
const neighborhoodPriorities = [...neighborhoodMap.values()].map((summary) => ({
  ...summary,
  topDestinations: summary.topDestinations.sort((left, right) => right.score - left.score).slice(0, 5)
})).sort((left, right) => right.totalAmenities - left.totalAmenities || right.destinationCount - left.destinationCount || left.neighborhood.localeCompare(right.neighborhood));

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  generatedOn: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()),
  sourceRecordCount: destinations.length,
  summary: {
    placeholderOnly: records.filter((record) => record.coverageStatus === "placeholder-only").length,
    oneApprovedImage: records.filter((record) => record.coverageStatus === "one-approved-image").length,
    multipleApprovedImages: records.filter((record) => record.coverageStatus === "multiple-approved-images").length,
    highestPriorityGaps: records.filter((record) => record.acquisitionPriority === "highest").length
  },
  scoringNote: "Priority favors destinations without approved images, then amenity richness, source evidence, official-page coverage, and held candidates. It is a work-queue score, not a measure of park quality or popularity.",
  neighborhoodPriorities,
  records
};

const topGaps = records.filter((record) => record.imageCount === 0).slice(0, 30);
const markdown = `# Park image coverage report

Generated ${report.generatedOn} from ${report.sourceRecordCount} destination records.

## Coverage summary

- Placeholder only: ${report.summary.placeholderOnly}
- One approved image: ${report.summary.oneApprovedImage}
- Multiple approved images: ${report.summary.multipleApprovedImages}
- Highest-priority gaps: ${report.summary.highestPriorityGaps}

${report.scoringNote}

## Top 30 acquisition priorities

| Rank | Destination | Neighborhood | Amenities | Score | Review history |
| ---: | --- | --- | ---: | ---: | --- |
${topGaps.map((record, index) => `| ${index + 1} | ${record.publicName} | ${record.neighborhood || "Not listed"} | ${record.amenityCount} | ${record.acquisitionPriorityScore} | ${record.candidateReviewHistory.held} held, ${record.candidateReviewHistory.rejected} rejected |`).join("\n")}

## Neighborhood clusters

| Neighborhood | Gaps | Highest priority | Listed amenities across gaps | Leading destinations |
| --- | ---: | ---: | ---: | --- |
${neighborhoodPriorities.slice(0, 20).map((summary) => `| ${summary.neighborhood} | ${summary.destinationCount} | ${summary.highestPriorityCount} | ${summary.totalAmenities} | ${summary.topDestinations.map((destination) => destination.publicName).join(", ")} |`).join("\n")}
`;

await mkdir(outputDirectoryUrl, { recursive: true });
await writeFile(jsonOutputUrl, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(markdownOutputUrl, markdown);
console.log(`Image coverage: ${report.summary.placeholderOnly} placeholder-only, ${report.summary.oneApprovedImage} with one approved image, ${report.summary.multipleApprovedImages} with multiple approved images.`);
console.log(`Highest-priority gaps: ${report.summary.highestPriorityGaps}.`);
console.log(`Wrote ${jsonOutputUrl.pathname}`);
console.log(`Wrote ${markdownOutputUrl.pathname}`);
