import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateUiContent } from "../scripts/validate-ui-content.mjs";

const content = JSON.parse(await readFile(
  new URL("../data/presentation/ui-content.json", import.meta.url), "utf8"
));

test("the committed UI content contract is complete", () => {
  assert.deepEqual(validateUiContent(content), []);
});

test("coverage wording cannot omit the missing-information warning", () => {
  const copy = structuredClone(content);
  delete copy.coverage["open-data-only"].missingInformation;
  assert.ok(validateUiContent(copy).some((item) => item.includes("open-data-only")));
});

test("official actions must be labeled as external handoffs", () => {
  const copy = structuredClone(content);
  copy.officialActions.registration.external = false;
  assert.ok(validateUiContent(copy).some((item) => item.includes("registration")));
});

