import { mkdir, rename, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultOutputDirectory = new URL("../data/imports/", import.meta.url);
const endpoint = "https://api.511.org/transit/datafeeds";

export function buildFeedUrl(apiKey) {
  if (!apiKey?.trim()) throw new Error("511_API_KEY is required.");
  const url = new URL(endpoint);
  url.searchParams.set("api_key", apiKey.trim());
  url.searchParams.set("operator_id", "RG");
  return url;
}

export async function importRegionalGtfs({
  apiKey = process.env["511_API_KEY"],
  fetchImpl = fetch,
  outputDirectory = defaultOutputDirectory,
  now = () => new Date()
} = {}) {
  const url = buildFeedUrl(apiKey);
  const response = await fetchImpl(url, { headers: { Accept: "application/zip" } });
  if (!response.ok) throw new Error(`511 regional GTFS returned HTTP ${response.status}.`);

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("511 regional GTFS response was not a ZIP archive.");
  }

  await mkdir(outputDirectory, { recursive: true });
  const outputUrl = new URL("511-regional-gtfs.zip", outputDirectory);
  const temporaryUrl = new URL("511-regional-gtfs.zip.tmp", outputDirectory);
  const metadataUrl = new URL("511-regional-gtfs.meta.json", outputDirectory);
  const metadataTemporaryUrl = new URL("511-regional-gtfs.meta.json.tmp", outputDirectory);
  const retrievedAt = now().toISOString();

  await writeFile(temporaryUrl, bytes);
  await writeFile(metadataTemporaryUrl, `${JSON.stringify({
    schemaVersion: 1,
    sourceId: "511-regional-gtfs",
    sourceUrl: "https://511.org/open-data/transit",
    operatorId: "RG",
    retrievedAt,
    byteLength: bytes.length,
    attributionLabel: "511 SF Bay, Metropolitan Transportation Commission"
  }, null, 2)}\n`, "utf8");
  await rename(temporaryUrl, outputUrl);
  await rename(metadataTemporaryUrl, metadataUrl);

  return { outputUrl, metadataUrl, byteLength: bytes.length };
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isCli) {
  try {
    const result = await importRegionalGtfs();
    console.log(`Imported ${(result.byteLength / 1_000_000).toFixed(1)} MB to ${fileURLToPath(result.outputUrl)}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
