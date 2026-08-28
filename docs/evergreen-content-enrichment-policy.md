# Evergreen content enrichment policy

## Purpose

This layer adds durable context that is useful but absent from the DataSF
inventory. It may describe a destination's identity, landscape, history,
permanent highlights, physical setting, and relationship to other public
places. It does not provide live or operational information.

## Allowed content

- A short, original overview of the destination's character.
- Durable historical context.
- Permanent landmarks, natural features, cultural features, and named areas.
- Broad recreation character without claims about current availability.
- Acreage, terrain, setting, and established year when explicitly supported.
- Stable relationships, such as a recreation center located within a park.

## Excluded content

Do not store hours, closures, construction status, schedules, fees, reservation
availability, contacts, current conditions, temporary rules, seasonal
operations, safety claims, or accessibility claims in this layer. These facts
change too readily or carry consequences that require a separate freshness
model and direct official verification.

## Source and writing rules

- Fetching and extraction happen offline, never while a resident waits.
- Use narrowly scoped requests, caching, conditional requests when supported,
  a descriptive user agent, and conservative rate limits.
- Extract factual candidates; do not automatically republish source prose.
- Write concise original summaries and keep each published statement connected
  to at least one reviewed source.
- Treat extracted candidates as unpublished until a person confirms the
  destination match, factual support, wording, and source references.
- A changed or ambiguous page enters a review report rather than overwriting
  approved content.
- Keep images in the separate media manifest and rights-review workflow.

## Wiki enrichment and page balance

Wikipedia, Wikidata, Wikimedia Commons, and LocalWiki may be used to discover
durable, place-specific facts that official destination pages omit. Prefer the
original authoritative source cited by a wiki when it is available. When a
wiki itself is retained as a source, record it explicitly, paraphrase rather
than copy its prose, and apply its attribution and licensing requirements.

Enrichment is gap-driven rather than source-driven: a long wiki article is not
an instruction to create a long destination page. Use these default limits for
the `About this place` section, regardless of a destination's fame:

- one short overview;
- one short history paragraph when a durable origin story is supported;
- no more than four representative highlights;
- no more than three physical facts; and
- only facts that add a distinct dimension rather than restating amenities.

Well-covered destinations should receive only the missing dimension. Sparse
destinations may use the same budget to establish identity, setting, and
history, but should not be padded to reach every limit. Exceeding a limit
requires a documented presentation reason, such as clarifying several public
places represented by one source record.

## Candidate extraction report

`npm run extract:evergreen` retrieves only the explicitly listed pilot pages,
waits between requests, identifies itself, caches responses, and uses ETag or
Last-Modified validators when the server supplies them. The generated report is
ignored by version control because it contains unpublished source excerpts.
Use `node scripts/extract-evergreen-candidates.mjs --offline` to regenerate the
report without contacting the source after a cache has been created.

For production expansion, `npm run discover:evergreen` reads the official
facility directory in batches of 100, ranks destinations by the number of
amenities already supported by open data, and fails closed when a page match is
ambiguous. `node scripts/extract-evergreen-candidates.mjs --production
--limit=20` then retrieves a ranked review batch using the same cache and delay
controls. Discovery and candidate files remain unpublished generated data.
Destinations whose official pages lack durable descriptive material are listed
in `data/content/evergreen-deferred.json`. They are removed from repeated
production batches and reserved for later research using another authoritative
source.

## Review completion

Official-page investigation is tracked separately from whether useful content
was found. Run `npm run report:official-page-review` to classify every
destination in a generated work queue:

- `reviewed-and-enriched`: a reviewed source supplied published descriptive
  content or a reviewed official directory supplied an amenity;
- `reviewed-no-additions`: the official page was reviewed but contained no
  durable, destination-specific information suitable for publication;
- `no-official-page`: investigation established that no destination-specific
  official page is available; and
- `pending-review`: the destination has not yet received a completed official
  page review.

`reviewed-no-additions` and `no-official-page` are complete review outcomes,
not content failures. Generated reports are ignored by version control; the
reviewed content, deferred registry, and directory-feature records remain the
versioned sources of truth.

## Presentation

Destination pages may show `About this place`, `Highlights`, and `History`
sections only when reviewed content exists. Missing evergreen content should
not produce an empty section or imply that the destination lacks significance.
