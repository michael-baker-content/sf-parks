import { readFile } from "node:fs/promises";
import process from "node:process";

const registryUrl = new URL("../data/sources.json", import.meta.url);
const registry = JSON.parse(await readFile(registryUrl, "utf8"));

const errors = [];
const warnings = [];
const ids = new Set();
const allowedStatuses = new Set(["approved", "pending", "rejected", "suspended"]);
const allowedKinds = new Set([
  "official_open_data",
  "official_webpage",
  "third_party",
  "manual"
]);

if (registry.schemaVersion !== 1) {
  errors.push("Unsupported or missing registry schemaVersion.");
}

if (!Array.isArray(registry.sources) || registry.sources.length === 0) {
  errors.push("The source registry must contain at least one source.");
}

for (const [index, source] of (registry.sources ?? []).entries()) {
  const label = source.id || `source[${index}]`;

  for (const field of ["id", "name", "kind", "publisher", "sourceUrl", "termsUrl"]) {
    if (!source[field]) errors.push(`${label}: missing ${field}.`);
  }

  if (ids.has(source.id)) errors.push(`${label}: duplicate source id.`);
  ids.add(source.id);

  if (!allowedKinds.has(source.kind)) errors.push(`${label}: unsupported source kind.`);
  if (!allowedStatuses.has(source.review?.status)) {
    errors.push(`${label}: unsupported or missing review status.`);
  }

  if (typeof source.containsPersonLevelData !== "boolean") {
    errors.push(`${label}: containsPersonLevelData must be explicitly true or false.`);
  }

  if (!Number.isInteger(source.freshness?.staleAfterDays) || source.freshness.staleAfterDays < 1) {
    errors.push(`${label}: freshness.staleAfterDays must be a positive integer.`);
  }

  if (source.review?.status === "approved") {
    if (!source.license?.id || !source.license?.url || !source.license?.metadataCheckedAt) {
      errors.push(`${label}: approved source is missing reviewed license metadata.`);
    }
    if (!source.review.reviewedAt || !source.review.reviewedBy) {
      errors.push(`${label}: approved source is missing review attribution.`);
    }
    for (const use of ["ingest", "display"]) {
      if (!source.permittedUses?.includes(use)) {
        errors.push(`${label}: approved source does not permit ${use}.`);
      }
    }
    if (source.containsPersonLevelData) {
      errors.push(`${label}: person-level sources cannot be approved by this registry.`);
    }
  } else {
    warnings.push(`${label}: ingestion blocked (${source.review?.status}).`);
  }
}

if (errors.length) {
  console.error("Source registry is invalid:\n" + errors.map((item) => `- ${item}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Source registry valid: ${registry.sources.length} sources checked.`);
}

if (warnings.length) {
  console.warn("\nPolicy warnings:\n" + warnings.map((item) => `- ${item}`).join("\n"));
}

