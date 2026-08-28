import { readFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

const contentUrl = new URL("../data/presentation/ui-content.json", import.meta.url);
const requiredCategories = new Set([
  "playgrounds", "picnic", "sports", "fitness", "swimming", "dogs",
  "recreation-centers", "gardens-nature", "arts-culture", "visitor-services"
]);
const requiredCoverage = new Set(["official-page-reviewed", "open-data-only"]);
const requiredActions = new Set([
  "information-page", "facility-page", "schedule", "registration", "reservation", "pdf", "maintenance"
]);

export function validateUiContent(content) {
  const errors = [];
  if (content.schemaVersion !== 1) errors.push("Unsupported schemaVersion.");
  if (!Number.isInteger(content.resultCard?.visibleAmenityLimit)
    || content.resultCard.visibleAmenityLimit < 1) {
    errors.push("resultCard.visibleAmenityLimit must be a positive integer.");
  }

  const groups = content.amenityGroups ?? [];
  const groupIds = groups.map((item) => item.id);
  if (new Set(groupIds).size !== groupIds.length) errors.push("Amenity group IDs must be unique.");
  for (const id of requiredCategories) {
    if (!groupIds.includes(id)) errors.push(`Missing amenity group: ${id}.`);
  }
  for (const group of groups) {
    if (!group.label || !Number.isFinite(group.order)) errors.push(`${group.id}: invalid group label or order.`);
  }

  for (const id of requiredCoverage) {
    const item = content.coverage?.[id];
    if (!item?.shortLabel || !item?.description || !item?.missingInformation) {
      errors.push(`Incomplete coverage wording: ${id}.`);
    }
  }
  for (const id of requiredActions) {
    const item = content.officialActions?.[id];
    if (!item?.label || item.external !== true) errors.push(`Incomplete official action: ${id}.`);
  }
  if (!content.quantityNotice || !content.handoffNotice || !content.emptyOfficialActions || !content.independenceNotice) {
    errors.push("Required trust and handoff wording is missing.");
  }
  return errors;
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  const content = JSON.parse(await readFile(contentUrl, "utf8"));
  const errors = validateUiContent(content);
  if (errors.length) {
    console.error(`UI content contract is invalid:\n${errors.map((item) => `- ${item}`).join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log("UI content contract valid.");
  }
}
