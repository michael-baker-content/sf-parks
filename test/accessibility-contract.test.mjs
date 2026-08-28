import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("the shared layout provides language, landmarks, and a skip target", async () => {
  const layout = await readFile(new URL("app/layout.tsx", root), "utf8");

  assert.match(layout, /<html lang="en">/);
  assert.match(layout, /href="#main-content"[^>]*>Skip to main content</);
  assert.match(layout, /<nav aria-label="Primary">/);
  assert.match(layout, /<main id="main-content"[^>]*tabIndex=\{-1\}/);
});

test("visible keyboard focus works against light and dark surfaces", async () => {
  const styles = await readFile(new URL("app/styles.css", root), "utf8");
  const focusRule = styles.match(/:focus-visible\s*\{([^}]+)\}/)?.[1] ?? "";

  assert.match(focusRule, /outline:/);
  assert.match(focusRule, /box-shadow:/);
});

test("the layout floor preserves the 320 CSS pixel reflow target", async () => {
  const styles = await readFile(new URL("app/styles.css", root), "utf8");

  assert.match(styles, /--app-min-viewport:\s*19rem/);
  assert.match(styles, /body\s*\{[^}]*min-width:\s*var\(--app-min-viewport\)/);
});

test("the core text palette retains WCAG AA contrast", () => {
  const white = "#ffffff";
  assert.ok(contrast("#1b1b1b", white) >= 4.5, "primary text on white");
  assert.ok(contrast("#565c65", white) >= 4.5, "muted text on white");
  assert.ok(contrast("#1b5e3b", white) >= 4.5, "green text on white");
  assert.ok(contrast("#123f2a", white) >= 4.5, "dark green text on white");
  assert.ok(contrast(white, "#123f2a") >= 4.5, "white text on dark green");
});
