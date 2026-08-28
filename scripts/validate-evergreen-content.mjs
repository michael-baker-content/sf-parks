import { readFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

const registryUrl = new URL("../data/content/evergreen-content.json", import.meta.url);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const destinationPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const highlightCategories = new Set([
  "landscape",
  "landmark",
  "natural-feature",
  "cultural-feature",
  "recreation-character",
  "destination-relationship"
]);
const factCategories = new Set(["acreage", "terrain", "setting", "established-year"]);

function nonemptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validHttpsUrl(value) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function validateSourceRefs(refs, sourceIds, label, errors) {
  if (!Array.isArray(refs) || refs.length === 0) {
    errors.push(`${label}: at least one sourceRef is required.`);
    return;
  }
  for (const ref of refs) if (!sourceIds.has(ref)) errors.push(`${label}: unknown sourceRef ${ref}.`);
}

export function validateEvergreenContent(document) {
  const errors = [];
  if (document.schemaVersion !== 1) errors.push("Unsupported schemaVersion.");
  if (!nonemptyText(document.reviewPolicy)) errors.push("A review policy is required.");
  if (!Array.isArray(document.records)) return [...errors, "records must be an array."];

  const destinationIds = new Set();
  for (const [index, record] of document.records.entries()) {
    const label = record.destinationId || `records[${index}]`;
    if (!destinationPattern.test(record.destinationId ?? "")) errors.push(`${label}: invalid destinationId.`);
    if (destinationIds.has(record.destinationId)) errors.push(`${label}: destinationId must be unique.`);
    destinationIds.add(record.destinationId);

    if (!Array.isArray(record.sources) || record.sources.length === 0) errors.push(`${label}: at least one source is required.`);
    const sourceIds = new Set();
    for (const [sourceIndex, source] of (record.sources ?? []).entries()) {
      const sourceLabel = `${label}.sources[${sourceIndex}]`;
      for (const field of ["id", "title"]) if (!nonemptyText(source[field])) errors.push(`${sourceLabel}: missing ${field}.`);
      if (!validHttpsUrl(source.url)) errors.push(`${sourceLabel}: source URL must use HTTPS.`);
      if (!datePattern.test(source.retrievedAt ?? "")) errors.push(`${sourceLabel}: retrievedAt must use YYYY-MM-DD.`);
      if (sourceIds.has(source.id)) errors.push(`${sourceLabel}: source id must be unique within the destination.`);
      sourceIds.add(source.id);
    }

    let contentBlocks = 0;
    if (record.overview !== undefined) {
      contentBlocks += 1;
      if (!nonemptyText(record.overview?.text)) errors.push(`${label}.overview: text is required.`);
      validateSourceRefs(record.overview?.sourceRefs, sourceIds, `${label}.overview`, errors);
    }
    if (record.history !== undefined) {
      contentBlocks += 1;
      if (!nonemptyText(record.history?.text)) errors.push(`${label}.history: text is required.`);
      validateSourceRefs(record.history?.sourceRefs, sourceIds, `${label}.history`, errors);
    }
    if (record.highlights !== undefined) {
      if (!Array.isArray(record.highlights)) errors.push(`${label}.highlights must be an array.`);
      for (const [itemIndex, item] of (record.highlights ?? []).entries()) {
        contentBlocks += 1;
        const itemLabel = `${label}.highlights[${itemIndex}]`;
        if (!nonemptyText(item.label)) errors.push(`${itemLabel}: label is required.`);
        if (!nonemptyText(item.description)) errors.push(`${itemLabel}: description is required.`);
        if (!highlightCategories.has(item.category)) errors.push(`${itemLabel}: category is not evergreen.`);
        validateSourceRefs(item.sourceRefs, sourceIds, itemLabel, errors);
      }
    }
    if (record.physicalFacts !== undefined) {
      if (!Array.isArray(record.physicalFacts)) errors.push(`${label}.physicalFacts must be an array.`);
      for (const [itemIndex, item] of (record.physicalFacts ?? []).entries()) {
        contentBlocks += 1;
        const itemLabel = `${label}.physicalFacts[${itemIndex}]`;
        if (!nonemptyText(item.label) || !nonemptyText(item.value)) errors.push(`${itemLabel}: label and value are required.`);
        if (!factCategories.has(item.category)) errors.push(`${itemLabel}: category is not evergreen.`);
        validateSourceRefs(item.sourceRefs, sourceIds, itemLabel, errors);
      }
    }
    if (contentBlocks === 0) errors.push(`${label}: at least one evergreen content block is required.`);

    if (record.review?.status !== "approved") errors.push(`${label}: review status must be approved before publication.`);
    for (const field of ["reviewedBy", "notes"]) if (!nonemptyText(record.review?.[field])) errors.push(`${label}: review.${field} is required.`);
    if (!datePattern.test(record.review?.reviewedAt ?? "")) errors.push(`${label}: review.reviewedAt must use YYYY-MM-DD.`);
  }
  return errors;
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  const document = JSON.parse(await readFile(registryUrl, "utf8"));
  const errors = validateEvergreenContent(document);
  if (errors.length) {
    console.error(`Evergreen content registry is invalid:\n${errors.map((item) => `- ${item}`).join("\n")}`);
    process.exitCode = 1;
  } else console.log(`Evergreen content registry valid: ${document.records.length} reviewed destinations.`);
}
