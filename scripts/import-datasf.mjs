import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const registryUrl = new URL("../data/sources.json", import.meta.url);
const defaultOutputDirectory = new URL("../data/imports/", import.meta.url);
const pageSize = 1000;

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashRecord(record) {
  return createHash("sha256").update(canonicalJson(record)).digest("hex");
}

export function assertSourceMayBeIngested(source) {
  if (!source) throw new Error("Unknown source id.");
  if (source.review?.status !== "approved") {
    throw new Error(`${source.id}: source review status is not approved.`);
  }
  if (!source.permittedUses?.includes("ingest")) {
    throw new Error(`${source.id}: ingestion is not permitted.`);
  }
  if (source.containsPersonLevelData) {
    throw new Error(`${source.id}: person-level sources are blocked.`);
  }
  if (!source.license?.id || !source.license?.metadataCheckedAt) {
    throw new Error(`${source.id}: reviewed license metadata is missing.`);
  }
  if (!source.apiUrl) throw new Error(`${source.id}: API URL is missing.`);
}

export function addProvenance(record, source, retrievedAt) {
  const sourceRecordId = record.objectid ?? record.property_id ?? record.facility_id
    ?? record.funcarea_id ?? record.asset_id ?? hashRecord(record);
  const sourceUpdatedAt = record.data_as_of ?? record.data_loaded_at
    ?? record.last_edited_date ?? null;

  return {
    data: record,
    provenance: {
      sourceId: source.id,
      sourceRecordId: String(sourceRecordId),
      sourceUrl: source.sourceUrl,
      retrievedAt,
      sourceUpdatedAt,
      licenseId: source.license.id,
      contentHash: hashRecord(record),
      verificationStatus: "source-reported"
    }
  };
}

export async function fetchAllRows(source, { contact, fetchImpl = fetch } = {}) {
  if (!contact?.trim()) {
    throw new Error("SF_PARKS_CONTACT is required for identifiable API traffic.");
  }

  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL(source.apiUrl);
    url.searchParams.set("$limit", String(pageSize));
    url.searchParams.set("$offset", String(offset));
    url.searchParams.set("$order", ":id");

    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": `sf-parks-explorer/0.0.0 (${contact.trim()})`
      }
    });
    if (!response.ok) {
      throw new Error(`${source.id}: DataSF returned HTTP ${response.status}.`);
    }

    const page = await response.json();
    if (!Array.isArray(page)) throw new Error(`${source.id}: API response was not an array.`);
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

export async function importSource(sourceId, options = {}) {
  const registry = JSON.parse(await readFile(registryUrl, "utf8"));
  const source = registry.sources.find((item) => item.id === sourceId);
  assertSourceMayBeIngested(source);

  const retrievedAt = new Date().toISOString();
  const rows = await fetchAllRows(source, {
    contact: options.contact ?? process.env.SF_PARKS_CONTACT,
    fetchImpl: options.fetchImpl
  });
  if (rows.length === 0) throw new Error(`${source.id}: refusing to publish an empty import.`);

  const snapshot = {
    schemaVersion: 1,
    source: {
      id: source.id,
      name: source.name,
      datasetId: source.datasetId,
      sourceUrl: source.sourceUrl,
      license: source.license,
      attributionLabel: source.attributionLabel
    },
    import: {
      retrievedAt,
      recordCount: rows.length,
      verificationStatus: "source-reported"
    },
    records: rows.map((row) => addProvenance(row, source, retrievedAt))
  };

  const outputDirectory = options.outputDirectory ?? defaultOutputDirectory;
  await mkdir(outputDirectory, { recursive: true });
  const outputUrl = new URL(`${source.id}.json`, outputDirectory);
  const temporaryUrl = new URL(`${source.id}.json.tmp`, outputDirectory);
  await writeFile(temporaryUrl, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await rename(temporaryUrl, outputUrl);
  return { outputUrl, recordCount: rows.length };
}

const isCli = process.argv[1]
  && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isCli) {
  const sourceId = process.argv[2];
  if (!sourceId) {
    console.error("Usage: npm run import:datasf -- <source-id>");
    process.exitCode = 1;
  } else {
    try {
      const result = await importSource(sourceId);
      console.log(`Imported ${result.recordCount} records to ${fileURLToPath(result.outputUrl)}.`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}

