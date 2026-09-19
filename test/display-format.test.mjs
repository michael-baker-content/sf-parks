import assert from "node:assert/strict";
import test from "node:test";
import { acreageText, amenityQuantityText, reviewedDateText } from "../src/lib/display-format.js";

test("display formatters keep quantities, acreage, and reviewed dates consistent", () => {
  assert.equal(amenityQuantityText({ label: "Tennis Court", quantity: null, quantityStatus: "not-verified" }), "Tennis Court");
  assert.equal(amenityQuantityText({ label: "Tennis Court", quantity: 1, quantityStatus: "official-page-verified" }), "1 tennis court");
  assert.equal(amenityQuantityText({ label: "Tennis Court", quantity: 2, quantityStatus: "official-page-verified" }), "2 tennis courts");
  assert.equal(acreageText(12.345), "12.35");
  assert.equal(reviewedDateText("2026-09-19"), "Sep 19, 2026");
});
