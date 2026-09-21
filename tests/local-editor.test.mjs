import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, copyFile, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { openStore, validateNotice } from "../tools/admin/store.mjs";
import { getActiveParkNotice } from "../src/lib/park-notices.js";

test("notices expire after the chosen San Francisco day and fail closed when inactive", () => {
  const notice = { destinationId: "park", active: true, title: "Notice", body: "Body", expiresOn: "2026-09-17" };
  assert.equal(getActiveParkNotice({ alerts: [notice] }, "park", new Date("2026-09-18T06:59:00Z")), notice);
  assert.equal(getActiveParkNotice({ alerts: [notice] }, "park", new Date("2026-09-18T07:00:00Z")), undefined);
  assert.equal(getActiveParkNotice({ alerts: [{ ...notice, active: false }] }, "park"), undefined);
  assert.throws(() => validateNotice({ ...notice, expiresOn: "2026-02-30" }, new Set(["park"])));
  assert.throws(() => validateNotice(notice, new Set()));
});

test("notice links are optional, trimmed, and restricted to safe web addresses", () => {
  const notice = { destinationId: "park", active: true, title: "Notice", body: "Body" };
  const ids = new Set(["park"]);
  assert.equal(validateNotice({ ...notice, url: " https://sfrecpark.org/ " }, ids).url, "https://sfrecpark.org/");
  assert.equal(validateNotice({ ...notice, url: " " }, ids).url, undefined);
  assert.equal(validateNotice({ ...notice, url: "https://sfrecpark.org/", urlText: " Official park update " }, ids).urlText, "Official park update");
  assert.equal(validateNotice({ ...notice, url: "", urlText: "No link" }, ids).urlText, undefined);
  for (const url of ["javascript:alert(1)", "data:text/html,bad", "/relative", "https://user:password@example.com"]) assert.throws(() => validateNotice({ ...notice, url }, ids));
});

test("local editor seeds photos, preserves sources, and safely removes catalog entries without deleting Blob records", async () => {
  const root = await mkdtemp(join(tmpdir(), "parks-editor-test-"));
  let store;
  try {
    const files = ["data/media/media-manifest.json", "data/media/blob-assets.json", "data/content/park-alerts.json", "data/presentation/generated/destinations.json", "data/content/evergreen-content.json", "data/normalized/transit.json"];
    const posts = await readdir(new URL("../content/blog/", import.meta.url));
    files.push(...posts.filter((name) => name.endsWith(".md")).map((name) => `content/blog/${name}`));
    for (const path of files) { await mkdir(dirname(join(root, path)), { recursive: true }); await copyFile(new URL(`../${path}`, import.meta.url), join(root, path)); }
    store = await openStore(root);
    const before = await store.state();
    const manifest = JSON.parse(await readFile(new URL("../data/media/media-manifest.json", import.meta.url)));
    assert.equal(before.images.length, manifest.images.length);
    assert.ok(before.images.some((image) => image.sourceType === "project-original"));
    const parkId = before.images[0].destinationId;
    const drafts = before.images.filter((image) => image.destinationId === parkId).reverse().map((image) => ({ ...image, visible: true }));
    drafts[0].visible = false;
    drafts[0].caption = "Reviewed editorial caption";
    await store.saveImages({ destinationId: parkId, images: drafts });
    const after = await store.state();
    const edited = after.images.find((image) => image.localPath === drafts[0].localPath);
    assert.equal(edited.visible, false);
    assert.equal(edited.position, 1);
    assert.equal(edited.caption, drafts[0].caption);
    assert.equal(edited.imageUrl, drafts[0].imageUrl);
    assert.equal(after.images.length, before.images.length);
    await assert.rejects(readFile(join(root, "photo-metadata-review.csv")), { code: "ENOENT" });
    await assert.rejects(store.saveImages({ destinationId: parkId, images: [{ ...drafts[0], localPath: "/media/not-cataloged.jpg" }] }), /unknown or duplicate/);
    const removable = after.images.find((image) => !before.blogs.some((post) => post.markdown.includes(image.localPath)));
    const removableParkImages = after.images.filter((image) => image.destinationId === removable.destinationId && image.localPath !== removable.localPath);
    await store.saveImages({ destinationId: removable.destinationId, images: removableParkImages });
    const afterRemoval = await store.state();
    assert.equal(afterRemoval.images.some((image) => image.localPath === removable.localPath), false);
    assert.equal(afterRemoval.blobAssets.some((asset) => asset.localPath === removable.localPath), true);
    const referenced = before.images.find((image) => before.blogs.some((post) => post.markdown.includes(image.localPath)));
    const referencedParkImages = afterRemoval.images.filter((image) => image.destinationId === referenced.destinationId && image.localPath !== referenced.localPath);
    await assert.rejects(store.saveImages({ destinationId: referenced.destinationId, images: referencedParkImages }), /blog posts/);
    await store.saveNotice({ destinationId: parkId, active: true, title: "Test notice", body: "Test only", expiresOn: "2026-12-31", url: "https://sfrecpark.org/", urlText: "Official park update" });
    assert.equal((await store.state()).notices.find((item) => item.destinationId === parkId).urlText, "Official park update");
    assert.equal((await store.state()).notices.find((item) => item.destinationId === parkId).url, "https://sfrecpark.org/");
    await store.saveNotice({ destinationId: parkId, active: true, title: "Test notice", body: "Test only", expiresOn: "2026-12-31", url: "" });
    assert.equal((await store.state()).notices.find((item) => item.destinationId === parkId).url, undefined);
    assert.equal((await store.state()).notices.find((item) => item.destinationId === parkId).expiresOn, "2026-12-31");
    await assert.rejects(store.saveBlog({ slug: "../../escape", markdown: "bad" }));
    await assert.rejects(store.saveBlog({ slug: "test-post", markdown: "---\ntitle: Title\nsummary: Summary\npublishedAt: 2026-02-30\n---\nBody" }));
    await store.saveBlog({ slug: "test-post", markdown: "---\ntitle: Title\nsummary: Summary\npublishedAt: 2026-09-17\n---\nBody" });
    assert.ok((await store.state()).blogs.some((post) => post.slug === "test-post"));
    await assert.rejects(store.upload({ destinationId: parkId, permission: false }), /permission/);
    assert.ok((await readdir(join(root, ".local-admin/backups"))).length >= 2);
  } finally { store?.close(); await rm(root, { recursive: true, force: true }); }
});
