import assert from "node:assert/strict";
import test from "node:test";
import { extractCandidateBlocks } from "../scripts/extract-evergreen-candidates.mjs";

test("candidate extraction separates durable descriptions from operating details", () => {
  const html = `
    <main>
      <h2>A 60-acre urban canyon contains a free-flowing creek, chert rock formations, wildlife habitat, and trails across a steep eastern slope.</h2>
      <p>Summer hours are Tuesday through Saturday and the schedule is subject to change. Reservations cost $15 and are currently available.</p>
      <p>The upper park terrace offers a downtown view, while its clubhouse can be reserved for private events.</p>
      <p>Contact the facility coordinator by phone for registration information and current closures.</p>
    </main>`;
  const blocks = extractCandidateBlocks(html);
  assert.equal(blocks.filter((item) => item.status === "candidate").length, 1);
  assert.equal(blocks.filter((item) => item.status === "candidate-needs-redaction").length, 1);
  assert.equal(blocks.filter((item) => item.status === "excluded-volatile").length, 2);
});

test("site-wide template claims are excluded from destination candidates", () => {
  const html = `<p>In 2017, San Francisco became the first city where every resident lives within a 10-minute walk of a park. Learn more about our department history.</p>`;
  assert.equal(extractCandidateBlocks(html)[0].status, "excluded-template");
});

test("navigation and short template fragments are ignored", () => {
  const html = `<nav><p>A historic park with trails and trees that should not be extracted from navigation.</p></nav><p>Hours</p>`;
  assert.deepEqual(extractCandidateBlocks(html), []);
});

test("double line breaks split long authored descriptions before classification", () => {
  const html = `<p>A steep hillside park has a broad staircase, terraced slopes, trees, benches, and panoramic views across the city.<br><br>The former quarry became a park in 1877 and its landscape was designed with formal terraces and walks.</p>`;
  assert.equal(extractCandidateBlocks(html).filter((item) => item.status === "candidate").length, 2);
});

test("common named punctuation entities are decoded in review text", () => {
  const html = `<p>The park&rsquo;s historic garden&mdash;opened in 1894&mdash;contains trees, paths, and a landmark pavilion.</p>`;
  assert.equal(extractCandidateBlocks(html)[0].text, "The park’s historic garden—opened in 1894—contains trees, paths, and a landmark pavilion.");
});
