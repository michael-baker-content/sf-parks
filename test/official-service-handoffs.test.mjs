import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const registry = JSON.parse(await readFile(new URL("../data/content/official-service-handoffs.json", import.meta.url), "utf8"));
const handoffs = [...registry.programs, ...registry.reservations];

test("official service handoffs are reviewed and point to San Francisco Recreation and Parks", () => {
  assert.match(registry.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
  for (const handoff of handoffs) {
    const url = new URL(handoff.url);
    assert.equal(url.protocol, "https:");
    assert.equal(url.hostname, "www.sfrecpark.org");
    assert.ok(handoff.label.trim());
    assert.ok(handoff.description.trim());
  }
});

test("official service handoff identifiers are unique", () => {
  const ids = handoffs.map((handoff) => handoff.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("each pathway retains a general official fallback", () => {
  assert.ok(registry.programs.some((handoff) => handoff.id === "all-programs"));
  assert.ok(registry.reservations.some((handoff) => handoff.id === "all-reservations"));
});
