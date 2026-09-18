import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("park alerts are opt-in and Lafayette retains its clearly labeled test notice", async () => {
  const document = JSON.parse(await readFile(new URL("../data/content/park-alerts.json", import.meta.url), "utf8"));
  assert.equal(document.defaultActive, false);
  const example = document.alerts.find((item) => item.destinationId === "lafayette-park");
  assert.ok(example?.active);
  assert.match(example.title, /test/i);
  assert.match(example.body, /not a report of a closure/);
  for (const notice of document.alerts) {
    assert.equal(typeof notice.active, "boolean");
    if (notice.active) { assert.ok(notice.title.trim()); assert.ok(notice.body.trim()); }
  }
});

test("the optional notice renders between the overview and location", async () => {
  const page = await readFile(new URL("../app/parks/[id]/page.tsx", import.meta.url), "utf8");
  assert.ok(page.indexOf('<section className="app-evergreen"') < page.indexOf("<ParkAlert notice="));
  assert.ok(page.indexOf("<ParkAlert notice=") < page.indexOf("<DestinationMap name="));
});
