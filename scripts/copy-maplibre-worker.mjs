import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const distribution = path.join(path.dirname(require.resolve("maplibre-gl/package.json")), "dist");
const destination = path.resolve("public", "maplibre");
await mkdir(destination, { recursive: true });
const worker = await readFile(path.join(distribution, "maplibre-gl-worker.mjs"), "utf8");
const shared = await readFile(path.join(distribution, "maplibre-gl-shared.mjs"), "utf8");
await Promise.all([
  writeFile(path.join(destination, "maplibre-gl-worker.js"), worker.replace("./maplibre-gl-shared.mjs", "./maplibre-gl-shared.js")),
  writeFile(path.join(destination, "maplibre-gl-shared.js"), shared),
]);
