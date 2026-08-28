import assert from "node:assert/strict";
import test from "node:test";
import {
  addProvenance,
  assertSourceMayBeIngested,
  hashRecord
} from "../scripts/import-datasf.mjs";

const approvedSource = {
  id: "example",
  sourceUrl: "https://example.test/dataset",
  apiUrl: "https://example.test/resource.json",
  containsPersonLevelData: false,
  permittedUses: ["ingest", "display"],
  license: { id: "PDDL-1.0", metadataCheckedAt: "2026-08-26" },
  review: { status: "approved" }
};

test("record hashes are stable regardless of object key order", () => {
  assert.equal(hashRecord({ a: 1, b: 2 }), hashRecord({ b: 2, a: 1 }));
});

test("provenance preserves source identity and content hash", () => {
  const record = { objectid: "42", property_name: "Example Park" };
  const result = addProvenance(record, approvedSource, "2026-08-26T12:00:00.000Z");
  assert.equal(result.data, record);
  assert.equal(result.provenance.sourceId, "example");
  assert.equal(result.provenance.sourceRecordId, "42");
  assert.equal(result.provenance.contentHash, hashRecord(record));
  assert.equal(result.provenance.verificationStatus, "source-reported");
});

test("ingestion fails closed for a pending source", () => {
  assert.throws(
    () => assertSourceMayBeIngested({ ...approvedSource, review: { status: "pending" } }),
    /not approved/
  );
});

test("ingestion rejects person-level data", () => {
  assert.throws(
    () => assertSourceMayBeIngested({ ...approvedSource, containsPersonLevelData: true }),
    /person-level/
  );
});

