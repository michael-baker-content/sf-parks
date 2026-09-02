import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the MapLibre worker uses JavaScript asset names that static servers recognize", async () => {
  const copyScript = await readFile(new URL("../scripts/copy-maplibre-worker.mjs", import.meta.url), "utf8");
  const component = await readFile(new URL("../components/ResultsMap.tsx", import.meta.url), "utf8");
  assert.match(copyScript, /maplibre-gl-worker\.js/);
  assert.match(copyScript, /maplibre-gl-shared\.js/);
  assert.match(copyScript, /replace\("\.\/maplibre-gl-shared\.mjs", "\.\/maplibre-gl-shared\.js"\)/);
  assert.match(component, /setWorkerUrl\("\/maplibre\/maplibre-gl-worker\.js"\)/);
});
