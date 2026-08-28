import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const deploymentVariables = ["NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY"];
const localOnlyVariables = ["511_API_KEY", "SF_PARKS_CONTACT", "PIXABAY_API_KEY"];

async function sourceFiles(directory) {
  const entries = await readdir(new URL(`${directory}/`, root), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await sourceFiles(path));
    else if (/\.(?:js|jsx|ts|tsx|mjs)$/.test(entry.name)) files.push(path);
  }
  return files;
}

test("the deployment example exposes only approved runtime variables", async () => {
  const example = await readFile(new URL(".env.example", root), "utf8");
  const active = example.split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1])
    .filter(Boolean);
  assert.deepEqual(active, deploymentVariables);
});

test("local maintenance credentials cannot enter deployed application code", async () => {
  const files = (await Promise.all(["app", "components", "src"].map(sourceFiles))).flat();
  const source = (await Promise.all(files.map(async (path) => readFile(new URL(path, root), "utf8")))).join("\n");
  for (const variable of localOnlyVariables) assert.doesNotMatch(source, new RegExp(variable));
});

test("local script credentials avoid deployment-style static environment references", async () => {
  const files = await sourceFiles("scripts");
  const source = (await Promise.all(files.map(async (path) => readFile(new URL(path, root), "utf8")))).join("\n");
  for (const variable of localOnlyVariables) {
    assert.doesNotMatch(source, new RegExp(`process\\.env\\.${variable}`));
  }
});
