import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const destinationsUrl = new URL("../data/presentation/generated/destinations.json", import.meta.url);
const evergreenUrl = new URL("../data/content/evergreen-content.json", import.meta.url);
const deferredUrl = new URL("../data/content/evergreen-deferred.json", import.meta.url);
const noOfficialPageUrl = new URL("../data/content/official-page-no-match.json", import.meta.url);
const secondPassUrl = new URL("../data/content/official-page-second-pass.json", import.meta.url);
const directoryFeaturesUrl = new URL("../data/presentation/directory-features.json", import.meta.url);
const outputDirectoryUrl = new URL("../data/content/generated/", import.meta.url);
const jsonOutputUrl = new URL("official-page-review-report.json", outputDirectoryUrl);
const markdownOutputUrl = new URL("official-page-review-report.md", outputDirectoryUrl);

const pendingDeferredReview = (record) =>
  /review the official detail page/i.test(record.nextStep ?? "");

export function buildOfficialPageReviewReport({ destinations, evergreen, deferred, noOfficialPages, secondPassReviews, directoryFeatures }) {
  const evergreenById = new Map(evergreen.records.map((record) => [record.destinationId, record]));
  const deferredById = new Map(deferred.records.map((record) => [record.destinationId, record]));
  const noOfficialPageById = new Map(noOfficialPages.records.map((record) => [record.destinationId, record]));
  const secondPassById = new Map(secondPassReviews.records.map((record) => [record.destinationId, record]));
  const featuresById = new Map(directoryFeatures.records.map((record) => [record.destinationId, record]));

  const records = destinations.records.map((destination) => {
    const evergreenRecord = evergreenById.get(destination.id);
    const featureRecord = featuresById.get(destination.id);
    const deferredRecord = deferredById.get(destination.id);
    const enriched = Boolean(evergreenRecord || featureRecord);
    const completedWithoutAdditions = Boolean(deferredRecord && !pendingDeferredReview(deferredRecord));
    const noOfficialPageRecord = noOfficialPageById.get(destination.id);
    const secondPassRecord = secondPassById.get(destination.id);
    const status = enriched
      ? "reviewed-and-enriched"
      : completedWithoutAdditions
        ? "reviewed-no-additions"
        : noOfficialPageRecord
          ? "no-official-page"
          : "pending-review";

    return {
      destinationId: destination.id,
      publicName: destination.publicName,
      amenityCount: destination.amenities.length,
      status,
      evidence: [
        evergreenRecord ? "reviewed-evergreen-content" : null,
        featureRecord ? "reviewed-directory-features" : null,
        completedWithoutAdditions ? "documented-no-additions" : null,
        noOfficialPageRecord ? "documented-no-official-page" : null,
        secondPassRecord ? "expanded-official-search" : null
      ].filter(Boolean),
      reason: completedWithoutAdditions ? deferredRecord.reason : noOfficialPageRecord?.reason ?? null,
      nextStep: status === "pending-review"
        ? deferredRecord?.nextStep ?? "Find and review a destination-specific official page, or document that none is available."
        : null
    };
  });

  const statuses = ["reviewed-and-enriched", "reviewed-no-additions", "no-official-page", "pending-review"];
  const summary = Object.fromEntries(statuses.map((status) => [status, records.filter((record) => record.status === status).length]));
  const completed = summary["reviewed-and-enriched"] + summary["reviewed-no-additions"] + summary["no-official-page"];

  return {
    schemaVersion: 1,
    sourceRecordCount: destinations.records.length,
    completedReviewCount: completed,
    completionPercent: Number(((completed / destinations.records.length) * 100).toFixed(1)),
    summary,
    records: records.sort((a, b) => {
      if (a.status === "pending-review" && b.status !== "pending-review") return -1;
      if (a.status !== "pending-review" && b.status === "pending-review") return 1;
      return b.amenityCount - a.amenityCount || a.publicName.localeCompare(b.publicName);
    })
  };
}

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

export async function buildFromFiles() {
  const [destinations, evergreen, deferred, noOfficialPages, secondPassReviews, directoryFeatures] = await Promise.all([
    readJson(destinationsUrl), readJson(evergreenUrl), readJson(deferredUrl), readJson(noOfficialPageUrl), readJson(secondPassUrl), readJson(directoryFeaturesUrl)
  ]);
  const report = buildOfficialPageReviewReport({ destinations, evergreen, deferred, noOfficialPages, secondPassReviews, directoryFeatures });
  const pending = report.records.filter((record) => record.status === "pending-review");
  const markdown = `# Official page review report

Review completion: **${report.completedReviewCount} of ${report.sourceRecordCount} destinations (${report.completionPercent}%)**

| Outcome | Destinations |
| --- | ---: |
| Reviewed and enriched | ${report.summary["reviewed-and-enriched"]} |
| Reviewed, no additions | ${report.summary["reviewed-no-additions"]} |
| No destination-specific official page | ${report.summary["no-official-page"]} |
| Pending review | ${report.summary["pending-review"]} |

## Pending review queue

Prioritized by currently listed amenity count.

${pending.map((record) => `- **${record.publicName}** (${record.amenityCount} amenities): ${record.nextStep}`).join("\n") || "No pending destinations."}
`;

  await mkdir(outputDirectoryUrl, { recursive: true });
  await Promise.all([
    writeFile(jsonOutputUrl, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
    writeFile(markdownOutputUrl, markdown, "utf8")
  ]);
  return report;
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  try {
    const report = await buildFromFiles();
    console.log(`Official-page review: ${report.completedReviewCount}/${report.sourceRecordCount} complete (${report.completionPercent}%).`);
    console.log(`${report.summary["pending-review"]} destinations remain in the review queue.`);
    console.log(`Wrote ${fileURLToPath(jsonOutputUrl)}`);
    console.log(`Wrote ${fileURLToPath(markdownOutputUrl)}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
