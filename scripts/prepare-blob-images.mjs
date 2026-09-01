import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = new URL("../", import.meta.url);
const sourceDirectory = new URL("../public/media/", import.meta.url);
const stagingDirectory = new URL("../.tmp-blob-media/", import.meta.url);
const planUrl = new URL("../data/media/generated/blob-upload-plan.json", import.meta.url);
const targetWidths = [640, 1280];

await rm(stagingDirectory, { recursive: true, force: true });
await mkdir(stagingDirectory, { recursive: true });
await mkdir(new URL("../data/media/generated/", import.meta.url), { recursive: true });

const filenames = (await readdir(sourceDirectory))
  .filter((filename) => /\.(jpe?g|png|webp)$/i.test(filename))
  .sort();
const assets = [];

for (const filename of filenames) {
  const sourceUrl = new URL(filename, sourceDirectory);
  const source = await readFile(sourceUrl);
  const hash = createHash("sha256").update(source).digest("hex").slice(0, 12);
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Could not read dimensions for ${filename}.`);

  const stem = basename(filename, extname(filename));
  const widths = [...new Set(targetWidths.map((width) => Math.min(width, metadata.width)))].sort((a, b) => a - b);
  const variants = [];

  for (const width of widths) {
    const blobPath = `media/${stem}/${hash}/${width}.webp`;
    const stagingUrl = new URL(blobPath, stagingDirectory);
    await mkdir(new URL("./", stagingUrl), { recursive: true });
    const info = await sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(fileURLToPath(stagingUrl));
    variants.push({
      width: info.width,
      height: info.height,
      bytes: (await stat(stagingUrl)).size,
      blobPath,
      stagingPath: join(".tmp-blob-media", ...blobPath.split("/")),
    });
  }

  assets.push({
    localPath: `/media/${filename}`,
    sourceBytes: source.length,
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    variants,
  });
}

const sourceBytes = assets.reduce((sum, asset) => sum + asset.sourceBytes, 0);
const preparedBytes = assets.flatMap((asset) => asset.variants).reduce((sum, variant) => sum + variant.bytes, 0);
const plan = {
  schemaVersion: 1,
  provider: "vercel-blob",
  generatedAt: new Date().toISOString(),
  settings: { format: "webp", quality: 82, targetWidths },
  summary: { assets: assets.length, variants: assets.flatMap((asset) => asset.variants).length, sourceBytes, preparedBytes },
  assets,
};

await writeFile(planUrl, `${JSON.stringify(plan, null, 2)}\n`);
const percent = Math.round((1 - preparedBytes / sourceBytes) * 100);
console.log(`Prepared ${plan.summary.variants} variants for ${plan.summary.assets} images.`);
console.log(`Reduced ${(sourceBytes / 1024 / 1024).toFixed(2)} MB of source files to ${(preparedBytes / 1024 / 1024).toFixed(2)} MB (${percent}% smaller).`);
console.log(`Wrote ${planUrl.pathname}.`);
