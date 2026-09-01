import { readFile, writeFile } from "node:fs/promises";
import { list, put } from "@vercel/blob";

const planUrl = new URL("../data/media/generated/blob-upload-plan.json", import.meta.url);
const registryUrl = new URL("../data/media/blob-assets.json", import.meta.url);

if (!process.env["BLOB_READ_WRITE_TOKEN"]) {
  throw new Error("BLOB_READ_WRITE_TOKEN is required. Create a public Blob store and pull or copy its token into .env.local.");
}

const plan = JSON.parse(await readFile(planUrl, "utf8"));
const assets = [];
const existing = new Map();
let cursor;
do {
  const page = await list({ prefix: "media/", limit: 1000, cursor });
  for (const blob of page.blobs) existing.set(blob.pathname, blob);
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

for (const asset of plan.assets) {
  const variants = [];
  for (const variant of asset.variants) {
    const result = existing.get(variant.blobPath) ?? await put(
      variant.blobPath,
      await readFile(new URL(`../${variant.stagingPath.replaceAll("\\", "/")}`, import.meta.url)),
      {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: false,
        cacheControlMaxAge: 31536000,
        contentType: "image/webp",
      },
    );
    variants.push({ width: variant.width, height: variant.height, bytes: variant.bytes, url: result.url, pathname: result.pathname });
    console.log(`${existing.has(variant.blobPath) ? "Reused" : "Uploaded"} ${result.pathname}`);
  }
  assets.push({ localPath: asset.localPath, variants });
}

const registry = {
  schemaVersion: 1,
  provider: "vercel-blob",
  generatedAt: new Date().toISOString(),
  assets,
};
await writeFile(registryUrl, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Uploaded ${assets.flatMap((asset) => asset.variants).length} variants and updated ${registryUrl.pathname}.`);
