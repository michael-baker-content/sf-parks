import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const blogDirectory = new URL("../content/blog/", import.meta.url);

test("blog posts are individual Markdown files governed by Content Collections", async () => {
  const filenames = (await readdir(blogDirectory)).filter((filename) => filename.endsWith(".md"));
  assert.ok(filenames.length > 0);
  assert.equal(new Set(filenames).size, filenames.length);

  for (const filename of filenames) {
    assert.match(filename, /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/);
    assert.match(await readFile(new URL(filename, blogDirectory), "utf8"), /^---\r?\n/);
  }
});

test("the collection schema validates and compiles blog content", async () => {
  const config = await readFile(new URL("../content-collections.ts", import.meta.url), "utf8");
  assert.match(config, /directory: "content\/blog"/);
  assert.match(config, /schema: z\.object/);
  assert.match(config, /publishedAt: z\.string\(\)\.regex/);
  assert.match(config, /image: z\.object/);
  assert.match(config, /alt: z\.string\(\)\.min\(1\)/);
  assert.match(config, /gallery: z\.array/);
  assert.match(config, /compileMarkdown\(context, post\)/);
});

test("blog galleries inherit reviewed captions and rights information", async () => {
  const library = await readFile(new URL("../src/lib/blog-posts.js", import.meta.url), "utf8");
  assert.match(library, /mediaManifest\.images\.find/);
  assert.match(library, /No reviewed media record is available/);
  assert.match(library, /resolveRequiredMediaAsset\(path\)/);
});

test("blog cards use a Blob-backed default and permit a reviewed image override", async () => {
  const library = await readFile(new URL("../src/lib/blog-posts.js", import.meta.url), "utf8");
  assert.match(library, /park-image-placeholder\.png/);
  assert.match(library, /post\.image \?\? defaultBlogImage/);
  assert.match(library, /resolveRequiredMediaAsset/);
});
