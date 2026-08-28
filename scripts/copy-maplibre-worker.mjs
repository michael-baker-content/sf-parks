import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const distribution = path.join(path.dirname(require.resolve("maplibre-gl/package.json")), "dist");
const destination = path.resolve("public", "maplibre");
await mkdir(destination, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) await copyFile(path.join(distribution, file), path.join(destination, file));
