import { DatabaseSync } from "node:sqlite";
import { mkdir, readFile, writeFile, rename, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { validateMediaManifest } from "../../scripts/validate-media-manifest.mjs";
import { nearbyTransit } from "../../src/lib/nearby-transit.js";

const files = { media: "data/media/media-manifest.json", blob: "data/media/blob-assets.json", notices: "data/content/park-alerts.json", parks: "data/presentation/generated/destinations.json", evergreen: "data/content/evergreen-content.json" };
const text = (value, label) => { if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`); return value.trim(); };
const date = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
export function validateNotice(value, ids) {
  if (!ids.has(value.destinationId)) throw new Error("Unknown park.");
  if (typeof value.active !== "boolean") throw new Error("Active must be true or false.");
  if (value.expiresOn && !date(value.expiresOn)) throw new Error("Expiration must be a valid YYYY-MM-DD date.");
  const url = String(value.url ?? "").trim();
  const urlText = String(value.urlText ?? "").trim();
  if (url) {
    let parsed;
    try { parsed = new URL(url); } catch { throw new Error("Notice URL must be a complete HTTP or HTTPS web address."); }
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("Notice URL must be an HTTP or HTTPS web address without embedded credentials.");
  }
  return { destinationId: value.destinationId, active: value.active, title: value.active ? text(value.title, "Notice title") : String(value.title ?? "").trim(), body: value.active ? text(value.body, "Notice body") : String(value.body ?? "").trim(), ...(value.expiresOn ? { expiresOn: value.expiresOn } : {}), ...(url ? { url, ...(urlText ? { urlText } : {}) } : {}) };
}

export async function openStore(root) {
  const privateDir = join(root, ".local-admin");
  await mkdir(join(privateDir, "backups"), { recursive: true });
  const db = new DatabaseSync(join(privateDir, "editorial.sqlite"));
  db.exec("PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (kind TEXT, id TEXT, content TEXT NOT NULL, PRIMARY KEY(kind,id)); CREATE TABLE IF NOT EXISTS edits (id INTEGER PRIMARY KEY, edited_at TEXT NOT NULL, kind TEXT NOT NULL, record_id TEXT NOT NULL, content TEXT NOT NULL);");
  const read = async (relative) => JSON.parse(await readFile(join(root, relative), "utf8"));
  const snapshot = (kind, id, content) => db.prepare("INSERT INTO records VALUES (?,?,?) ON CONFLICT(kind,id) DO UPDATE SET content=excluded.content").run(kind, id, JSON.stringify(content));
  const recordEdit = (kind, id, content) => { snapshot(kind, id, content); db.prepare("INSERT INTO edits (edited_at,kind,record_id,content) VALUES (?,?,?,?)").run(new Date().toISOString(), kind, id, JSON.stringify(content)); };
  const save = async (relative, content) => {
    const target = join(root, relative);
    const prior = await readFile(target).catch((error) => { if (error.code !== "ENOENT") throw error; return null; });
    if (prior) await writeFile(join(privateDir, "backups", `${Date.now()}-${randomUUID()}-${relative.replaceAll(/[\\/]/g, "_")}`), prior);
    const temporary = `${target}.${randomUUID()}.tmp`;
    await writeFile(temporary, content);
    await rename(temporary, target);
  };
  const jsonSave = (relative, document) => save(relative, `${JSON.stringify(document, null, 2)}\n`);
  const assertManifest = (manifest) => { const errors = validateMediaManifest(manifest); if (errors.length) throw new Error(errors.join("\n")); };
  const ids = new Set((await read(files.parks)).records.map((park) => park.id));
  for (const image of (await read(files.media)).images) snapshot("image", image.localPath, image);
  for (const notice of (await read(files.notices)).alerts) snapshot("notice", notice.destinationId, notice);

  const blogs = async () => Promise.all((await readdir(join(root, "content/blog"))).filter((name) => /^[a-z0-9-]+\.md$/.test(name)).sort().map(async (name) => ({ slug: name.slice(0, -3), markdown: await readFile(join(root, "content/blog", name), "utf8") })));
  for (const blog of await blogs()) snapshot("blog", blog.slug, blog);
  return {
    close: () => db.close(),
    state: async () => {
      const parks = (await read(files.parks)).records;
      const transit = await read("data/normalized/transit.json");
      return { parks, nearbyTransit: Object.fromEntries(parks.map((park) => [park.id, nearbyTransit(transit, park.displayPoint)])), evergreen: (await read(files.evergreen)).records, images: (await read(files.media)).images, blobAssets: (await read(files.blob)).assets, notices: (await read(files.notices)).alerts, blogs: await blogs() };
    },
    async saveNotice(value) {
      const notice = validateNotice(value, ids);
      const document = await read(files.notices);
      document.alerts = [...document.alerts.filter((item) => item.destinationId !== notice.destinationId), notice];
      await jsonSave(files.notices, document);
      recordEdit("notice", notice.destinationId, notice);
    },
    async saveImages(value) {
      if (!ids.has(value.destinationId) || !Array.isArray(value.images)) throw new Error("Invalid park image collection.");
      const document = await read(files.media);
      const current = document.images.filter((image) => image.destinationId === value.destinationId);
      const submittedPaths = new Set(value.images.map((image) => image.localPath));
      if (submittedPaths.size !== value.images.length || value.images.some((image) => !current.some((item) => item.localPath === image.localPath))) throw new Error("Image changes contain an unknown or duplicate image.");
      const removed = current.filter((image) => !submittedPaths.has(image.localPath));
      if (removed.length) {
        const posts = await blogs();
        const references = removed.flatMap((image) => posts.filter((post) => post.markdown.includes(image.localPath)).map((post) => `${image.localPath} in ${post.slug}`));
        if (references.length) throw new Error(`Remove these image references from the listed blog posts before removing the catalog entries: ${references.join(", ")}.`);
      }
      const updates = new Map(value.images.map((image, index) => {
        const original = current.find((item) => item.localPath === image.localPath);
        if (!original || typeof image.visible !== "boolean") throw new Error("Invalid image identity or visibility.");
        const updated = { ...original, caption: text(image.caption, "Caption"), alt: text(image.alt, "Alt text"), creator: text(image.creator, "Creator"), attribution: text(image.attribution, "Attribution"), visible: image.visible, position: index + 1 };
        if (original.sourceType === "project-original") { updated.licenseId = text(image.licenseId, "License"); updated.licenseUrl = text(image.licenseUrl, "License URL"); }
        return [original.localPath, updated];
      }));
      const removedPaths = new Set(removed.map((image) => image.localPath));
      document.images = document.images.filter((image) => !removedPaths.has(image.localPath)).map((image) => updates.get(image.localPath) ?? image);
      assertManifest(document);
      await jsonSave(files.media, document);
      for (const image of updates.values()) recordEdit("image", image.localPath, image);
      for (const image of removed) recordEdit("image", image.localPath, { ...image, removed: true, removedAt: new Date().toISOString() });
      return { removed: removed.map((image) => image.localPath) };
    },
    async saveBlog(value) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug ?? "")) throw new Error("Use a lowercase, hyphen-separated blog filename.");
      const markdown = text(value.markdown, "Markdown");
      const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
      const publishedAt = frontmatter?.match(/^publishedAt:[ \t]*(\d{4}-\d{2}-\d{2})[ \t]*$/m)?.[1];
      if (!frontmatter || !/^title:[ \t]*\S.*$/m.test(frontmatter) || !/^summary:[ \t]*\S.*$/m.test(frontmatter) || !publishedAt || !date(publishedAt)) throw new Error("Blog frontmatter requires title, summary, and publishedAt (YYYY-MM-DD). The production build performs full Content Collections validation.");
      await save(`content/blog/${value.slug}.md`, `${markdown}\n`);
      recordEdit("blog", value.slug, { slug: value.slug, markdown });
    },
    async upload(value) {
      if (!ids.has(value.destinationId)) throw new Error("Unknown park.");
      if (value.permission !== "on" && value.permission !== true) throw new Error("Confirm permission to publish this photograph.");
      if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is missing from .env.local.");
      const caption = text(value.caption, "Caption"), alt = text(value.alt, "Alt text"), creator = text(value.creator, "Creator"), attribution = text(value.attribution, "Attribution");
      const originalFilename = text(value.filename, "Filename");
      if (!/^[A-Za-z0-9_. -]+$/.test(originalFilename)) throw new Error("Use a simple original filename without directory paths.");
      const bytes = Buffer.from(text(value.base64, "Image file"), "base64");
      if (bytes.length > 20 * 1024 * 1024) throw new Error("Image exceeds the 20 MB limit.");
      const metadata = await sharp(bytes, { limitInputPixels: 50000000 }).metadata();
      if (!["jpeg", "png", "webp"].includes(metadata.format)) throw new Error("Upload a JPEG, PNG, or WebP image.");
      const oriented = await sharp(bytes).rotate().toBuffer({ resolveWithObject: true });
      const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
      const stem = `${value.destinationId}-${randomUUID()}`;
      const document = await read(files.media);
      const image = { destinationId: value.destinationId, position: Math.max(0, ...document.images.filter((item) => item.destinationId === value.destinationId).map((item) => item.position)) + 1, sourceType: "project-original", originalFilename: `${stem}-${originalFilename}`, localPath: `/media/${stem}.jpg`, width: oriented.info.width, height: oriented.info.height, caption, alt, creator, attribution, licenseId: value.licenseId, licenseUrl: value.licenseUrl, visible: true, reviewedAt: new Date().toISOString().slice(0, 10), sourceRevision: `Contributor upload: ${originalFilename}; SHA256 ${createHash("sha256").update(bytes).digest("hex")}`, filePageUrl: "https://validation.public.blob.vercel-storage.com/pending.webp", imageUrl: "https://validation.public.blob.vercel-storage.com/pending.webp" };
      assertManifest({ ...document, images: [...document.images, image] });
      const variants = [];
      for (const width of [...new Set([640, 1280].map((target) => Math.min(target, oriented.info.width)))]) {
        const converted = await sharp(oriented.data).resize({ width, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toBuffer({ resolveWithObject: true });
        const pathname = `media/${stem}/${hash}/${width}.webp`;
        const result = await put(pathname, converted.data, { access: "public", addRandomSuffix: false, allowOverwrite: false, cacheControlMaxAge: 31536000, contentType: "image/webp" });
        variants.push({ width: converted.info.width, height: converted.info.height, bytes: converted.data.length, url: result.url, pathname: result.pathname });
      }
      const largest = variants.at(-1);
      Object.assign(image, { imageUrl: largest.url, filePageUrl: largest.url, width: largest.width, height: largest.height });
      const registry = await read(files.blob);
      registry.assets.push({ localPath: image.localPath, variants });
      registry.generatedAt = new Date().toISOString();
      // Register delivery first. A failed manifest save cannot create a broken public image.
      await jsonSave(files.blob, registry);
      document.images.push(image);
      await jsonSave(files.media, document);
      recordEdit("image", image.localPath, image);
      return image;
    },
  };
}
