import { readFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

const manifestUrl = new URL("../data/media/media-manifest.json", import.meta.url);
const reusableLicense = /^(CC0-1\.0|PDM-1\.0|CC-BY-(1\.0|2\.0|2\.5|3\.0|4\.0)|CC-BY-SA-(1\.0|2\.0|2\.5|3\.0|4\.0))$/;
const requiredText = ["destinationId", "localPath", "caption", "creator", "attribution", "licenseId", "alt", "reviewedAt", "sourceRevision"];
const requiredUrls = ["filePageUrl", "imageUrl", "licenseUrl"];

function validHttpsUrl(value, hostname) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (!hostname || url.hostname === hostname);
  } catch { return false; }
}

export function validateMediaManifest(manifest) {
  const errors = [];
  if (manifest.schemaVersion !== 1) errors.push("Unsupported schemaVersion.");
  if (!manifest.reviewPolicy) errors.push("A review policy is required.");
  if (!Array.isArray(manifest.images)) return [...errors, "images must be an array."];
  const sourceAssets = new Set();
  const slidePositions = new Set();
  for (const [position, image] of manifest.images.entries()) {
    const label = image.destinationId || `images[${position}]`;
    for (const field of requiredText) if (typeof image[field] !== "string" || !image[field].trim()) errors.push(`${label}: missing ${field}.`);
    for (const field of requiredUrls) if (!validHttpsUrl(image[field])) errors.push(`${label}: invalid ${field}.`);
    const sourceType = image.sourceType ?? "wikimedia-commons";
    if (sourceType === "wikimedia-commons") {
      if (!/^Q\d+$/.test(image.wikidataEntityId ?? "")) errors.push(`${label}: invalid Wikidata entity ID.`);
      if (typeof image.commonsFileTitle !== "string" || !image.commonsFileTitle.trim()) errors.push(`${label}: missing commonsFileTitle.`);
      if (!validHttpsUrl(image.filePageUrl, "commons.wikimedia.org")) errors.push(`${label}: file page must be on Wikimedia Commons.`);
      if (!validHttpsUrl(image.imageUrl, "upload.wikimedia.org")) errors.push(`${label}: image must be served by Wikimedia upload infrastructure.`);
    } else if (sourceType === "localwiki") {
      if (!validHttpsUrl(image.filePageUrl, "localwiki.org")) errors.push(`${label}: source page must be on LocalWiki.`);
      if (!validHttpsUrl(image.imageUrl, "localwiki.org")) errors.push(`${label}: image must be served by LocalWiki.`);
      if (!validHttpsUrl(image.localwikiFileApiUrl, "localwiki.org")) errors.push(`${label}: LocalWiki file API URL is required.`);
    } else errors.push(`${label}: unsupported sourceType.`);
    if (!reusableLicense.test(image.licenseId ?? "")) errors.push(`${label}: license is not initially approved.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(image.reviewedAt ?? "")) errors.push(`${label}: reviewedAt must use YYYY-MM-DD.`);
    if (!/^\/media\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(image.localPath ?? "")) errors.push(`${label}: invalid localPath.`);
    if (!Number.isInteger(image.position) || image.position < 1) errors.push(`${label}: position must be a positive integer.`);
    if (!Number.isInteger(image.width) || image.width < 1 || !Number.isInteger(image.height) || image.height < 1) errors.push(`${label}: valid image dimensions are required.`);
    const positionKey = `${image.destinationId}:${image.position}`;
    if (slidePositions.has(positionKey)) errors.push(`${label}: slide position must be unique within a destination.`);
    const sourceAsset = image.commonsFileTitle ?? image.localwikiFileApiUrl;
    if (sourceAssets.has(sourceAsset)) errors.push(`${label}: source image is duplicated.`);
    slidePositions.add(positionKey);
    sourceAssets.add(sourceAsset);
  }
  return errors;
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  const errors = validateMediaManifest(manifest);
  if (errors.length) {
    console.error(`Media manifest is invalid:\n${errors.map((item) => `- ${item}`).join("\n")}`);
    process.exitCode = 1;
  } else console.log(`Media manifest valid: ${manifest.images.length} published images.`);
}
