import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

const pilotSourceListUrl = new URL("../data/content/pilot-sources.json", import.meta.url);
const productionSourceListUrl = new URL("../data/content/generated/evergreen-sources.json", import.meta.url);
const cacheDirectory = new URL("../data/content/generated/cache/", import.meta.url);
const reportUrl = new URL("../data/content/generated/evergreen-candidates.json", import.meta.url);
const volatilePattern = /\b(hours?|open|closed|closure|schedule|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|fee|\$\d|reserv(?:e|ed|ation|ations)|register|registration|contacts?|phone|email|available|availability|maintenance issue|subject to change|temporary|until|currently|newly|high demand|now designated|accessib(?:le|ility)|wheelchair access|after-school program|tot playtime|pilates|yoga|zumba|bingo|movie nights?|tai chi|pack out|trash|recyclables)\b/i;
const evergreenPattern = /\b(acres?|park|playground|garden|canyon|creek|hill|slope|terrace|trail|landscape|habitat|wildlife|landmark|historic|history|established|built|renovated|view|overlook|lawn|trees?|rock|field|court|recreation center|clubhouse|named|bounded)\b/i;
const boilerplatePattern = /(?:every resident lives within a 10-minute walk of a park|learn more about our department history|recreation and park department manages more than)/i;

function decodeHtml(value) {
  const entities = {
    amp: "&", apos: "'", quot: '"', lt: "<", gt: ">", nbsp: " ",
    lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—",
    hellip: "…", deg: "°"
  };
  return value.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match);
}

function cleanText(value) {
  return decodeHtml(value.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ").trim();
}

export function extractCandidateBlocks(html) {
  const body = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ");
  const blocks = [];
  const seen = new Set();
  const blockPattern = /<(h2|h3|p)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const match of body.matchAll(blockPattern)) {
    for (const chunk of match[2].split(/(?:<br\s*\/?>\s*){2,}/i)) {
      const text = cleanText(chunk);
      if (text.length < 70 || text.length > 1200 || seen.has(text)) continue;
      seen.add(text);
      const volatileMatches = [...text.matchAll(new RegExp(volatilePattern.source, "gi"))].map((item) => item[0].toLowerCase());
      const evergreenMatches = [...text.matchAll(new RegExp(evergreenPattern.source, "gi"))].map((item) => item[0].toLowerCase());
      const status = boilerplatePattern.test(text)
        ? "excluded-template"
        : volatileMatches.length && evergreenMatches.length
          ? "candidate-needs-redaction"
          : volatileMatches.length
            ? "excluded-volatile"
            : evergreenMatches.length
              ? "candidate"
              : "excluded-low-signal";
      blocks.push({
        text,
        status,
        evergreenSignals: [...new Set(evergreenMatches)],
        volatileSignals: [...new Set(volatileMatches)]
      });
    }
  }
  return blocks;
}

function cacheUrls(destinationId) {
  return {
    html: new URL(`${destinationId}.html`, cacheDirectory),
    metadata: new URL(`${destinationId}.json`, cacheDirectory)
  };
}

async function readOptionalJson(url) {
  try { return JSON.parse(await readFile(url, "utf8")); } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function retrieve(source, offline) {
  const cache = cacheUrls(source.destinationId);
  const metadata = await readOptionalJson(cache.metadata);
  if (offline) return { html: await readFile(cache.html, "utf8"), metadata, cacheStatus: "offline" };

  const headers = { "User-Agent": "SF-Parks-Explorer/0.1 (evergreen content research; local build script)" };
  if (metadata?.etag) headers["If-None-Match"] = metadata.etag;
  if (metadata?.lastModified) headers["If-Modified-Since"] = metadata.lastModified;
  const response = await fetch(source.url, { headers, redirect: "follow" });
  if (response.status === 304) return { html: await readFile(cache.html, "utf8"), metadata, cacheStatus: "not-modified" };
  if (!response.ok) throw new Error(`${source.destinationId}: HTTP ${response.status}.`);
  const html = await response.text();
  const nextMetadata = {
    sourceUrl: source.url,
    retrievedAt: new Date().toISOString(),
    etag: response.headers.get("etag"),
    lastModified: response.headers.get("last-modified")
  };
  await mkdir(cacheDirectory, { recursive: true });
  await Promise.all([
    writeFile(cache.html, html, "utf8"),
    writeFile(cache.metadata, `${JSON.stringify(nextMetadata, null, 2)}\n`, "utf8")
  ]);
  return { html, metadata: nextMetadata, cacheStatus: metadata ? "refreshed" : "created" };
}

export async function buildCandidateReport({ offline = false, production = false, limit = null } = {}) {
  const sourceListUrl = production ? productionSourceListUrl : pilotSourceListUrl;
  const sourceList = JSON.parse(await readFile(sourceListUrl, "utf8"));
  if (sourceList.schemaVersion !== 1 || !Array.isArray(sourceList.sources)) throw new Error("Invalid pilot source list.");
  const records = [];
  const selectedSources = limit ? sourceList.sources.slice(0, limit) : sourceList.sources;
  for (const [index, source] of selectedSources.entries()) {
    if (index > 0 && !offline) await new Promise((resolve) => setTimeout(resolve, 1500));
    const retrieved = await retrieve(source, offline);
    const blocks = extractCandidateBlocks(retrieved.html);
    records.push({
      destinationId: source.destinationId,
      sourceUrl: source.url,
      retrievedAt: retrieved.metadata?.retrievedAt ?? null,
      cacheStatus: retrieved.cacheStatus,
      contentHash: createHash("sha256").update(retrieved.html).digest("hex"),
      candidates: blocks.filter((block) => block.status.startsWith("candidate")),
      exclusions: blocks.filter((block) => !block.status.startsWith("candidate"))
    });
  }
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    publicationStatus: "candidates-only-human-review-required",
    records
  };
  await mkdir(new URL("../data/content/generated/", import.meta.url), { recursive: true });
  await writeFile(reportUrl, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  try {
    const limitArgument = process.argv.find((argument) => argument.startsWith("--limit="));
    const limit = limitArgument ? Number.parseInt(limitArgument.split("=")[1], 10) : null;
    if (limitArgument && (!Number.isInteger(limit) || limit < 1)) throw new Error("--limit must be a positive integer.");
    const report = await buildCandidateReport({
      offline: process.argv.includes("--offline"),
      production: process.argv.includes("--production"),
      limit
    });
    const candidates = report.records.reduce((sum, record) => sum + record.candidates.length, 0);
    console.log(`Evergreen candidate report written: ${candidates} passages across ${report.records.length} destinations.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
