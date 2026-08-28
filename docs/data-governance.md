# Data governance

## Purpose

SF Parks Explorer reorganizes public information around resident needs. It does
not replace an authoritative City source, guarantee that source data is correct,
or represent the City and County of San Francisco.

## Admission rule

Every external source must have a registry entry in `data/sources.json` before
an importer is written. Automated ingestion is allowed only when:

1. `review.status` is `approved`;
2. the source has a specific license or terms URL;
3. the review records who made the decision and when;
4. the permitted uses include both ingestion and display; and
5. the source does not contain person-level information.

`pending`, `rejected`, and `suspended` sources must fail closed. A source should
be suspended when its terms, ownership, access controls, or page structure
change materially.

## Source classes

### Official open data

Use an official API or download whenever available. Check the individual
dataset page and metadata for additional conditions; do not assume the general
DataSF PDDL statement applies when a dataset says otherwise.

### Official webpages

The DataSF Terms of Use apply to data available through `data.sfgov.org`. They
do not automatically license text, images, documents, or schedules published on
other City domains. A webpage requires its own review before extraction.

### Third-party systems

Vendor registration, reservation, and payment systems require a separate terms
and technical review. Never ingest authenticated pages, user data, checkout
flows, or information protected by access controls.

## Record-level provenance

Every normalized record and every enriched field must be traceable to a source.
The storage model must retain at least:

- `sourceId`: registry identifier;
- `sourceRecordId`: stable identifier supplied by the source, when available;
- `sourceUrl`: the authoritative record or dataset URL;
- `retrievedAt`: UTC timestamp of the successful retrieval;
- `sourceUpdatedAt`: source-provided update timestamp, when available;
- `licenseId`: license recorded at ingestion time;
- `contentHash`: hash of the normalized imported payload; and
- `verificationStatus`: `source-reported`, `cross-checked`, or `manually-verified`.

Derived values must retain references to every contributing source. A transform
must not erase the original imported value.

## Accuracy and freshness

- Present factual claims as source-reported unless independently verified.
- Show the authoritative source and freshness date in the interface.
- Link to the official page for rapidly changing or consequential information.
- Never describe availability, operating status, accessibility, or safety
  information as guaranteed.
- If an update fails, retain the last known value with a stale warning; do not
  silently replace it or present it as current.
- Importers must fail without publishing when validation detects a destructive
  or implausibly large change.

## Privacy

Do not ingest person-level data. Do not attempt to re-identify anonymized data,
combine datasets for re-identification, or contact people represented in a
dataset. If personally identifying information is discovered, quarantine the
affected import, prevent publication, destroy exposed copies as appropriate,
and follow the applicable source notification requirements.

## Public presentation

The application must display an independence statement in its global footer:

> Uses public data published by the City and County of San Francisco through
> DataSF. This independent application is not affiliated with or endorsed by
> the City. Verify important details with the linked official source.

Each result must expose its official source and a human-readable “checked” or
“data updated” date. City seals and logos must not be used without a separate
rights review.

## Operational requirements

- Use caching and conditional requests where supported.
- Identify scheduled import traffic with a descriptive user agent and contact.
- Apply per-source rate limits and exponential backoff.
- Do not bypass authentication, CAPTCHAs, robots directives, or technical
  access controls.
- Maintain change history for source terms and registry approvals.
- Review the DataSF terms and approved-source metadata periodically and suspend
  ingestion automatically when a monitored license changes.

## Legal baseline reviewed

- DataSF Terms of Use, dated April 21, 2017
- Reviewed for this project on August 26, 2026
- Terms URL: https://www.sf.gov/reports--april-2017--datasf-terms-use

This policy is an engineering and product control, not legal advice.

