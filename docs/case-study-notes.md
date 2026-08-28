# SF Parks Explorer case study notes

Living source document for a future PowerPoint or PDF case study.  
Audience: product, content strategy, UX, service design, civic technology, and
digital-program leadership.  
Last updated: August 28, 2026.

## How to use this document

Update this file when the project reaches a meaningful decision, encounters a
roadblock, changes direction, or produces measurable evidence. Write for a
professional audience that does not need to understand the implementation.

Keep three kinds of statements distinct:

- **Verified:** supported by project data, testing, or an authoritative source.
- **Observed:** seen in a sample or reported by a source but not demonstrated
  across the full user population.
- **Proposed:** a design direction that still needs validation.

Avoid presenting prototype results as improvements until comparative usability
testing supports that conclusion.

---

## Working title

**Designing Around the Bureaucracy: A Resident-Centered Explorer for San
Francisco Parks**

Alternative titles:

- From Government Data to Resident Decisions
- Finding the Park, Not the System
- Reducing Digital “Sludge” in Public Park Discovery

## One-sentence summary

SF Parks Explorer is an independent prototype that reorganizes fragmented public
park information around residents' ordinary questions without replacing the
City's authoritative registration, reservation, or payment systems.

## Executive summary

San Francisco offers an exceptional network of parks, playgrounds, recreation
centers, programs, and public amenities. Accessing information about those
services can require residents to understand multiple websites, vendor systems,
internal classifications, and inconsistent navigation paths.

This project explores whether a small, independent discovery layer can reduce
that burden. It uses official open data as its foundation, preserves links and
provenance, and presents parks and amenities using terminology familiar to
residents. Transactions remain in official systems.

The work is as much an information-architecture and service-design project as a
software project. The central challenge is not rendering a list of parks. It is
deciding how to translate internal records into useful public destinations
without inventing certainty or concealing the source data's limitations.

## Context and catalyst

The project began with Emma Silvers's August 24, 2026 Coyote Media article,
“San Francisco’s Parks Are Incredible. Why Is the Rec and Park Website So Bad?”

The article describes:

- residents struggling to find schedules and actionable information for known
  places such as Kezar Stadium and the Golden Gate Park Bandshell;
- registration and reservation paths spread across different interfaces;
- mobile pages that can fail during ordinary browsing;
- residents relying on physical signs, PDFs, flyers, community groups, and
  unofficial websites; and
- administrative friction that consumes time and can affect access to scarce,
  affordable public programs.

Source:
https://www.coyotemedia.org/san-francisco-rec-park-website-bad/

**Case-study framing:** The reported problem is not simply an unattractive
website. It is a service-design problem in which the public experience inherits
the boundaries of departments, databases, and vendors.

## Initial opportunity

Create a resident-centered layer that answers:

> Which park or recreation destination fits what I want to do, where I want to
> go, and the facilities I need?

The product would improve discovery and comprehension, then send residents to
the authoritative City system for registration, reservations, payments,
permits, or other official actions.

## Constraints accepted early

- The core experience should not depend on generative AI or per-query token
  costs.
- The prototype should not imitate or replace official transactions.
- Missing data must not be presented as proof that an amenity is unavailable.
- Exact quantities should appear only when supported by an appropriate source.
- The project must preserve data provenance and avoid implying City endorsement.
- Core browsing must work without a map and without a large client-side
  JavaScript dependency.

---

## Decision log

### Decision 1: Build a discovery layer, not a replacement system

**Decision:** Focus the MVP on finding and understanding destinations. Link to
official registration, reservation, payment, and maintenance workflows.

**Why it mattered:** Replacing transactions would introduce authentication,
payments, residency verification, inventory conflicts, personal data, and much
higher operational risk.

**Tradeoff:** Residents may still encounter friction after leaving the explorer.
The prototype can shorten the path and clarify the handoff, but it cannot repair
the transaction system itself.

**Status:** Approved product boundary.

### Decision 2: Do not make AI a dependency

**Decision:** Use conventional text search, synonyms, transparent activity
presets, structured filters, and deterministic ranking.

**Why it mattered:** This removes token costs, avoids generated or invented
results, improves predictability, and makes the product easier to sustain.

**Tradeoff:** The interface must do more information-architecture work upfront.
It cannot rely on a model to interpret every loosely phrased request.

**Status:** Encoded in the MVP and search specifications.

### Decision 3: Use official open data as the foundation

**Decision:** Build from Recreation and Parks datasets published through DataSF
and the Socrata API.

**Verified datasets:**

- Recreation and Parks Properties
- Recreation and Parks Facilities
- Functional Areas maintained by Recreation and Parks
- Assets maintained by Recreation and Parks

**Why it mattered:** Structured official data is more reliable and maintainable
than scraping the marketing site as the primary source.

**Tradeoff:** Asset-management data does not fully describe public experiences,
programs, schedules, hours, or reservation availability.

**Status:** Four datasets reviewed and approved for ingestion under PDDL terms.

### Decision 4: Encode governance before building the interface

**Decision:** Require every source to have recorded terms, license, review status,
provenance, freshness expectations, and privacy classification before ingestion.

**Why it mattered:** Open data is permissive, but the City does not guarantee its
accuracy. Dataset-specific conditions can also differ from general terms.

**Tradeoff:** This created more work before a visible prototype existed, but it
reduced the risk of building an interface on undocumented assumptions.

**Status:** Enforced through a source registry and automated validation.

### Decision 5: Preserve source data while creating a public model

**Decision:** Keep imported records unchanged, then create separate normalized
and presentation layers.

**Why it mattered:** Facility and functional-area IDs repeat, and relationships
are not always complete. A destructive cleanup would erase evidence and make
later corrections difficult.

**Tradeoff:** The data pipeline has several stages rather than one simplified
table.

**Status:** Implemented.

### Decision 6: Prefer familiar Parks language when the hierarchy is unclear

**Decision:** Preserve terminology and destination groupings familiar from the
public Parks site instead of exposing asset-management structure.

**Example:** Seven source properties named “Golden Gate Park - Section 1” through
“Section 7” become one public Golden Gate Park destination. The seven records
remain available for provenance and hidden-name search.

**Tradeoff:** Some expert users may need to find an internal section. Hidden
aliases and expandable source details mitigate that inconvenience.

**Status:** Implemented in the public destination layer.

### Decision 7: Combine duplicate public identities without erasing subplaces

**Decision:** A park and its principal recreation center may appear as one public
destination with clearly labeled subplaces.

**Example:** Glen Canyon Park and its recreation center are combined for search,
while park and recreation-center details remain distinguishable.

**Tradeoff:** Combining records can blur differences in hours, rules, and
locations. The destination model therefore retains subplaces.

**Status:** Implemented for reviewed examples.

### Decision 8: Treat quantities cautiously

**Decision:** Show verified recreational quantities when supported by an
official public page. Treat maintenance inventory as evidence of presence rather
than a promise of exact availability.

**Example:** Mission Dolores Park can show six tennis courts and two dog-play
areas because the official page supports those counts. It should not promise
that every source-listed bench or table is currently usable.

**Status:** Implemented in amenity evidence and coverage fields.

### Decision 9: Make activity choices transparent filter presets

**Decision:** Homepage choices such as “Play with kids” or “Have a picnic” lead
to the same result interface and disclose the amenities they represent.

**Why it mattered:** Separate activity microsites would recreate the fragmented
browsing problem the project is meant to reduce.

**Status:** Nine presets encoded in the search configuration.

### Decision 10: Explain matches and official handoffs explicitly

**Decision:** Result cards show the amenities responsible for a match before
general features. Destination pages use purpose-specific official actions such
as “View official schedule” or “Continue to official reservations” instead of
generic links.

**Why it mattered:** The reported browsing problem includes reaching descriptive
pages without finding the schedule, rule, or next action the resident sought.
Explicit match explanations reduce comparison work, while labeled handoffs make
the boundaries between the explorer and official systems visible.

**Status:** Encoded in the Phase 2 content contract.

### Decision 11: Adopt an accessible civic design-system foundation

**Decision:** Migrate the interface to statically generated Next.js pages and a
small reusable React component layer based on the U.S. Web Design System
(USWDS), customized with an independent San Francisco parks visual identity.

**Why it mattered:** The prototype had reached the point where search controls,
filters, cards, status messages, and destination layouts needed shared behavior
and consistent accessibility conventions. USWDS provides established public-
service patterns without requiring the product to copy the federal visual brand.

**Tradeoff:** React and Next.js add dependencies and framework maintenance. A
static export limits server-only features, but it preserves inexpensive hosting,
provides durable HTML destination pages, and keeps the daily data build separate
from public requests.

**Status:** Implemented as the Phase 2 interface foundation.

### Decision 12: Set a reasoned minimum viewport width

**Decision:** Support layouts down to 320 CSS pixels rather than using a more
comfortable contemporary-phone width as the minimum.

**Why it mattered:** A 320-pixel floor includes older compact smartphones while
still leaving enough room for readable type, touch targets, navigation, search,
and filter controls. Supporting every narrower width would create disproportionate
layout complexity and could make core controls harder to use.

**Tradeoff:** Viewports below 320 pixels may scroll horizontally rather than
compressing content beyond the supported layout floor.

**Status:** Encoded and browser-verified on the home, Explore, destination, and
About views.

---

## Roadblocks and responses

### Roadblock 1: Open data describes infrastructure, not the full public service

The datasets contain properties, physical facilities, functional areas, and
maintenance assets. They do not comprehensively provide:

- classes and camps;
- current schedules;
- prices;
- registration capacity;
- reservation availability;
- operating hours;
- temporary closures; or
- rich public descriptions.

**Response:** Keep open data as the authoritative physical foundation and define
official-page enrichment as a separate, freshness-aware layer. Do not infer
missing public features from unrelated source records.

### Roadblock 2: Source IDs are not uniformly unique at the row level

Initial import counts included:

- 255 property rows;
- 2,692 facility rows;
- 7,479 functional-area rows; and
- 9,314 asset rows.

Facilities and functional areas contained repeated entity IDs, often reflecting
components or geometry rather than accidental duplicate downloads.

**Response:** Group repeated IDs into canonical entities while retaining every
source-row reference and reporting conflicting values.

### Roadblock 3: Some relationships are incomplete

The normalization audit found unmatched property and facility relationships.

**Response:** Trust exact IDs automatically. Preserve unresolved records and
report possible gaps rather than linking by name or geography without review.

### Roadblock 4: Internal structure conflicts with public expectations

Golden Gate Park is divided into seven source properties. Recreation centers can
also appear as both a property and a facility.

**Response:** Add a reviewed presentation layer with virtual destinations,
principal facilities, subplaces, hidden aliases, and source-detail disclosure.

### Roadblock 5: Similar evidence can duplicate public amenities

A restroom or court may appear as a facility, several functional areas, and
multiple assets.

**Response:** Collapse evidence into one resident-facing amenity concept. Retain
the evidence internally, but do not turn component counts into unsupported
public quantities.

### Roadblock 6: Webpage rights and API rights are different

DataSF terms apply to data made available through DataSF. They do not
automatically license text, photographs, schedules, or vendor content on other
websites.

**Response:** Review webpage and third-party sources separately. Keep enrichment
provenance distinct from open-data provenance and avoid assuming that public
visibility equals republication permission.

### Roadblock 7: Browse categories can reproduce the original fragmentation

Creating a separate page hierarchy for every sport, amenity, property type, or
source system would create more silos.

**Response:** Use one Explore result surface. Activity choices are filter presets,
and every destination follows the same information hierarchy.

---

## Evidence generated so far

### Data pipeline

- 4 reviewed and approved DataSF sources
- 255 normalized properties
- 2,103 canonical facilities
- 6,857 canonical functional areas
- 849 public-facing facilities
- 2,112 public-facing functional areas
- 1,103 aggregated public asset summaries

### Public destination layer

- 249 resident-facing destinations
- 9 activity presets
- 59 amenity filters
- 41 neighborhood filters
- 12 place types

### Activity coverage in current data

| Activity | Destinations with positive listed evidence |
|---|---:|
| Play with kids | 137 |
| Play sports | 110 |
| Find a recreation center | 88 |
| Have a picnic | 85 |
| Visit a garden or natural area | 75 |
| Bring a dog | 34 |
| See arts and cultural features | 21 |
| Exercise | 19 |
| Swim | 8 |

These figures describe the current source coverage, not a verified inventory of
everything available citywide.

### Quality controls

- Sources fail closed until their terms and licenses are reviewed.
- Imports preserve record-level provenance and stable content hashes.
- Empty imports are rejected.
- Normalization does not silently invent relationships.
- Presentation quantities distinguish source-listed presence from official-page
  verification.
- Automated project tests currently pass.

---

## Representative examples

### Golden Gate Park

**Problem:** Seven internal source properties would create confusing duplicate
results.

**Design response:** One public destination, hidden searchable section aliases,
seven retained source subplaces, and no loss of provenance.

**Potential visual:** Before-and-after diagram showing seven source nodes
converging into one resident-facing destination.

### Mission Dolores Park

**Problem:** The same amenity can appear at multiple source levels.

**Design response:** Collapse evidence into familiar features while using the
official page to verify six tennis courts and two dog-play areas.

**Potential visual:** Evidence stack showing facility, functional-area, and
official-page inputs producing one amenity card.

### Glen Canyon Park Recreation Center

**Problem:** Open data captures the physical place but not familiar indoor
activities such as climbing, pickleball, or ping pong.

**Design response:** Combine the park and principal recreation center, retain
subplaces, and add reviewed official-page enrichment with its own provenance.

**Potential visual:** Destination page with “Park” and “Recreation Center” tabs
or sections and a visible coverage explanation.

### Douglass Playground

**Problem:** Open data did not expose the familiar athletic-field/baseball
feature presented on the official public page.

**Design response:** Add the feature only through reviewed enrichment rather
than inference.

**Potential visual:** Comparison of open-data-only and enriched coverage.

---

## Current product model

```text
DataSF sources
      ↓
Reviewed source registry
      ↓
Immutable imported snapshots
      ↓
Normalized properties, facilities, and amenities
      ↓
Reviewed public destinations and enrichment
      ↓
Local search index and transparent filters
      ↓
Explore → Results → Destination → Official next action
```

## Current MVP boundaries

Included:

- destination discovery;
- conventional text search;
- activity and amenity filters;
- neighborhood and place-type filters;
- combined public destinations;
- source and coverage explanations;
- official handoff links; and
- shareable URL state.

Deferred:

- registration and reservations;
- payments and accounts;
- live program capacity;
- live reservation availability;
- AI-dependent search;
- complete multilingual content;
- comprehensive automated webpage enrichment; and
- personalized recommendations.

---

## Claims that still require validation

Do not state these as outcomes yet:

- The prototype is faster than the official site.
- Residents find it easier to use.
- The activity taxonomy matches residents' mental models.
- Coverage labels prevent incorrect assumptions.
- Combined destinations reduce confusion.
- Users understand official handoffs.
- The interface improves access for lower-income or non-English-speaking
  residents.

These should become research questions for task-based usability testing.

## Planned evaluation

Representative tasks include:

1. Find a place with a playground, picnic area, and restroom.
2. Find tennis near the Mission.
3. Determine how many tennis courts Mission Dolores Park has.
4. Search for an internal Golden Gate Park section and understand the grouping.
5. Distinguish Glen Canyon Park from its recreation center.
6. Recognize that missing data is not confirmed absence.
7. Reach the official source for Douglass Playground's baseball diamond.

Potential measures:

- task completion;
- time on task;
- backtracking and filter changes;
- incorrect assumptions;
- understanding of source coverage;
- ability to find an official next action; and
- qualitative confidence and frustration.

## Future case-study slide outline

1. Title and one-sentence outcome
2. Why San Francisco parks matter
3. Reported resident pain
4. Reframing the problem as service design
5. Project constraints and non-goals
6. Source and governance strategy
7. The data-model challenge
8. Translating internal structure into public destinations
9. Representative example: Golden Gate Park
10. Representative example: Mission Dolores Park
11. Browsing and search model
12. Prototype screens
13. Usability-test approach
14. Results and iteration
15. What the prototype cannot solve
16. Lessons for public-service discovery

## Visual evidence to collect later

- Screenshots of representative official-site journeys
- Source-data relationship diagram
- Golden Gate Park grouping diagram
- Normalization conflict examples
- Search and activity-filter prototype screens
- Coverage and provenance interface examples
- Before/after task-flow diagrams
- Usability-testing quotes and metrics
- Mobile and accessibility validation
- Final responsive interface screens

Only collect and reproduce screenshots or images when their use is permitted and
properly attributed.

## Update log

### August 26, 2026

- Established the initial case-study framing.
- Recorded the MVP scope, open-data strategy, governance controls, normalization
  decisions, presentation decisions, and Phase 2 browsing model.
- Added current pipeline totals and separated verified evidence from untested
  product claims.
- Built the first list-first interface prototype using dependency-free shared
  modules for URL state, search, filtering, rendering, and content wording.
- Verified desktop semantics and a 390-pixel mobile layout with no horizontal
  overflow or browser-console errors.
- Browser testing exposed and resolved three presentation issues: internal
  Golden Gate Park sections appearing as public subplaces, contradictory
  official-page coverage wording, and a duplicate amenity caused by source
  capitalization differences.
- Migrated the interface to Next.js, TypeScript, and a customized USWDS
  component foundation while retaining deterministic local search and static
  hosting as product constraints.
- Stabilized the first design-system integration after browser testing revealed
  that framework search and button styles conflicted with the prototype's form
  structure. Consolidated search into one shared component and replaced the
  full-height mobile filter panel with an accessible disclosure that reports
  the number of active selections.
- Established and verified a 320 CSS-pixel minimum viewport, replacing the
  earlier 390-pixel mobile check with a more inclusive compact-phone target.
- Made search state easier to understand and revise by showing each active
  criterion as an individually removable control, while preserving the other
  selections. Added deterministic, plain-language explanations such as
  “Why this matched: Tennis Court” and prioritized the matching amenity on each
  result card. This improves transparency without introducing AI usage or token
  costs.
- Extended the same match explanation into destination pages so opening a park
  no longer drops the context of the resident's search. The detail view derives
  its explanation from the preserved results URL and the same deterministic
  rules used by result cards.
- Reworked official handoffs as typed, reviewed actions rather than one generic
  URL. Destination pages now identify the official service, show an external
  handoff indicator, and display the date each link was reviewed. The generated
  data model can later support schedules, registration, reservations, PDFs, and
  reporting links without changing the page structure.
- Replaced opaque property-only source details with a layered provenance view:
  familiar contributing place names first, DataSF datasets with retrieval and
  license links second, and reviewed official pages and presentation decisions
  where applicable. Technical identifiers remain available for audit inside an
  optional disclosure.
- Completed return-to-results context restoration for keyboard users. Both the
  explicit back link and browser Back restore focus to the originating result
  and bring it into view while preserving the exact query, filters, sort order,
  and result page. Temporary focus state is removed after restoration.
- Began the hybrid mapping strategy with optional Google Maps support on
  individual destination pages. Coordinate-based map and directions links work
  without credentials; a Google iframe is requested only after the resident
  selects “Show map” and only when a restricted Embed API key was supplied at
  build time. The accessible text location remains primary.
- Added an optional MapLibre results map without replacing the accessible
  destination list. Map state is shareable in the results URL, the library
  loads only when requested, markers reflect the full filtered result set, and
  popups preserve the destination-to-results return path. OpenFreeMap's quiet
  Positron street-grid style was selected as the default to provide recognizable
  geographic context without requiring another API key; deployments can still
  supply a reviewed style URL as configuration.
- Added decorative emoji to activity choices as lightweight visual scanning
  cues. The icons are stored separately from activity names and hidden from
  assistive technology, so labels remain concise and screen-reader output does
  not depend on inconsistent emoji descriptions.
- Reduced repeated uncertainty warnings on destination pages. Amenity lists now
  carry one plain-language rule explaining that counts appear only when
  officially verified, while per-amenity evidence status remains available in
  the source disclosure for auditability.
- Completed explicit ZIP-code browsing using ZIP codes already present in the
  normalized destination data. ZIP selections use the same transparent,
  shareable filter state as neighborhoods and require no location permission.
- Audited all four imported DataSF datasets for imagery fields and found none.
  Defined a separate, fail-closed Wikimedia enrichment path in which Wikidata
  discovers candidate Commons files, but each destination match, creator,
  license, attribution, restriction, and alternative description must be
  reviewed before publication. No third-party metadata request is added to the
  resident's browsing path.
- Validated the imagery path with two locally cached, reviewed Commons images
  for Golden Gate Park. The manual slideshow has no autoplay, announces its
  position, preserves image-specific captions and licenses, and reduces its
  visible controls to accessible arrow buttons at the 320-pixel layout floor.
- Expanded reviewed imagery to Mission Dolores Park. A correctly geolocated and
  openly licensed Washington Square candidate was deliberately rejected because
  it prominently showed a temporary event, demonstrating that licensing and
  location matching alone are not sufficient publication criteria.
- Replaced one-location imagery passes with batched entity matching, Commons
  metadata retrieval, downloads, and visual review. One batch published four
  images across Alamo Square, Buena Vista Park, and Kite Hill; a distant McLaren
  Park view was rejected as poor recognition imagery, while two transfers were
  deferred when Wikimedia rate-limited the file host.
- A following batch published Alta Plaza Park, Duboce Park, Lafayette Park, and
  Stern Grove together. Precita Park was rejected before download because its
  only Wikidata image documented temporary pandemic distancing circles; Lake
  Merced remained queued after file-host throttling.

- **Decision / result (imagery batch 3):** Retried Lake Merced alongside Ina
  Coolbrith Park, Tank Hill, and Telegraph Hill–Pioneer Park. Lake Merced and
  Ina Coolbrith passed destination, license, and visual review and were
  published. Wikimedia throttled the Tank Hill and Pioneer Park downloads, so
  those two remain queued rather than blocking the successful candidates. The
  reviewed collection now contains 13 images across 11 destinations.

- **Decision / result (imagery batch 4):** Resumed two candidates deferred after
  Wikimedia throttling, then tightened the visual-selection standard after
  reviewing them in context. The Tank Hill panorama documented the distant
  view rather than the park, while a Coit Tower portrait emphasized the landmark
  rather than Pioneer Park; both were removed. A Balboa Park candidate returned
  a throttling response instead of an image and was held back. The resulting
  rule prioritizes grounds, paths, landscape, and visitor experience, and keeps
  panoramas out of the lead position when another good image is available. The
  reviewed collection remains 13 images across 11 destinations.

- **Decision / result (LocalWiki source review):** Added LocalWiki to the
  candidate-source strategy after confirming that its read API is public and
  its default media license is CC BY 4.0. Individual captions and page history
  still require review because LocalWiki permits explicitly marked copyrighted
  or otherwise restricted media. Its San Francisco region has meaningful park
  coverage, but no Tank Hill page or file, so it will complement rather than
  replace Wikimedia Commons.

- The first LocalWiki discovery pass found three automatically matched image
  references; two pointed to missing media and the surviving South Park file
  was incorrectly oriented and not presentation-quality. A reviewed Pioneer
  Park name override uncovered a much more relevant photograph of the planted
  hillside and descending path. It remains held because its caption specifies
  CC BY-SA without the exact license version required by the media policy.

- Expanded LocalWiki discovery from park-titled pages to all 1,848 pages in its
  San Francisco region, using bounded pagination, request delays, and retry
  backoff. The pass found 22 files across 10 matched destinations. Portsmouth
  Square became the first published LocalWiki image after its page and file
  histories showed no exception to the default CC BY 4.0 license. A strong
  Palace of Fine Arts candidate was traced to its better-documented Wikimedia
  Commons source and published under its public-domain dedication. The reviewed
  collection now contains 15 images across 13 destinations.

- Closed the LocalWiki candidate batch with an explicit disposition for all 22
  files: two published, one held for an exact license version, two deferred as
  low-priority building views, and the remainder rejected for missing media,
  weak provenance, subject mismatch, or presentation quality. Future discovery
  runs now carry these decisions forward instead of returning reviewed files to
  an ambiguous pending state.

- Completed a five-destination Pixabay pilot focused on the highest-amenity
  pages still lacking imagery. Its API returned 50 results, but 48 were generic
  San Francisco landmarks with no destination-name evidence. The remaining two
  depicted Glen Canyon Dam in Arizona rather than Glen Canyon Park in San
  Francisco. No image was downloaded or published. A fail-closed identity screen
  now preserves raw results for audit while preventing generic stock imagery
  from entering visual review.

- Defined a separate fail-closed evergreen-content layer for durable identity,
  landscape, history, permanent highlights, and physical facts. Operational
  information such as hours, closures, fees, schedules, contacts, current
  conditions, and accessibility claims is excluded. Every publishable statement
  must cite a reviewed source, and extracted candidates remain unpublished
  until their destination match, factual support, and original wording are
  approved.

- Piloted the evergreen extraction workflow on three already-reviewed official
  facility pages. The first publication pass added original, source-linked
  overview, highlight, physical-setting, and history content for Mission
  Dolores Park, Glen Canyon Park Recreation Center, and Douglass Playground.
  Mixed source passages were redacted to remove programs, reservations,
  schedules, fees, and other operational details before any content reached the
  destination pages.

- Added a product-roadmap item for search access from anywhere in the site. A
  shared, accessible global search entry will send a basic query directly into
  the existing Explore URL state, avoiding a forced trip to the Explore page
  before a resident can begin searching and avoiding a second search system.

- Expanded reviewed evergreen content from three to seven destinations. The
  second batch added Alamo Square, Alta Plaza Park, Duboce Park, and Lafayette
  Park, while a template variation at Alta Plaza led to a more robust extractor
  that separates long source paragraphs at authored double line breaks before
  classification.

- Expanded reviewed evergreen content to 11 destinations with Buena Vista
  Park, Lake Merced Park, Sigmund Stern Recreation Grove, and Ina Coolbrith
  Park. This batch emphasized ecological and landscape context—oak woodland,
  watershed habitat, migratory-bird significance, concert-grove character, and
  steep urban viewpoints—without importing project updates or event schedules.

- Completed the planned 15-destination evergreen pilot with Golden Gate Park,
  Bernal Heights Park, Corona Heights Park, and Cayuga Playground. The final
  sample demonstrated that the model can handle a large point-of-interest
  directory, extensive natural and cultural history, a trail-focused hill park,
  and a community-created art landscape. Kite Hill was considered but left
  unenriched because its official facility page supplied no descriptive facts.

- Moved evergreen enrichment from a hand-selected pilot to a production queue.
  A new discovery pass reads the official facility directory in four
  100-result requests, conservatively matches pages by normalized names and
  addresses, and ranks destinations by their existing amenity count. The first
  run found 361 official pages and produced 195 confident matches; 54 uncertain
  or missing matches were held for review instead of being guessed.

- The first ranked production batch added original, reviewed evergreen content
  to 18 amenity-rich destinations, increasing coverage from 15 to 33 pages in a
  single pass. Time-sensitive wording about closures, programs, rentals,
  lighting, maintenance, and accessibility was removed, while durable setting,
  history, recreation character, and cultural details were retained.

- A second ranked production batch added 19 more destinations, bringing
  evergreen coverage to 52 pages. Six candidates were intentionally deferred:
  four official pages contained no descriptive material, one contained only a
  temporary construction notice, and one depended chiefly on an accessibility
  claim that requires a separate freshness and verification model.

- A third ranked batch added 18 destinations, raising evergreen coverage to 70
  pages. A small deferred registry was introduced after content-empty pages
  began recurring in successive ranked batches. This keeps the automated queue
  productive while preserving a visible path for later alternate-source
  research instead of silently treating those destinations as complete.

- A fourth ranked batch added another 18 destinations, bringing reviewed
  evergreen coverage to 88 pages. It added especially rich natural, cultural,
  and historical context for Pine Lake, Francisco Park, India Basin's tidal
  wetlands, Shoreview Park, Yik Oi Huang Peace & Friendship Park, and the
  Palace of Fine Arts. Seven more pages with no durable source prose or only
  temporary construction notices moved to the explicit alternate-source queue.

- A fifth ranked batch reviewed 30 official pages and published 19 durable
  destination profiles, raising coverage to 107 pages. Eleven content-empty
  pages moved to the alternate-source queue. The pass retained difficult but
  important civic history at Sharp Park and community-led histories at
  Buchanan Street Mall, Seward Mini Park, South Park, and Kid Power Park while
  excluding project schedules, rules, fees, and other operational material.

- The sixth ranked batch reached the long tail of the directory: 10 pages had
  destination-specific material worth publishing, increasing coverage to 117
  pages, while 23 blank or generic-template pages moved to alternate-source
  research. The strongest additions documented dune and hill ecosystems,
  Mount Davidson's cultural landscape, Fay Park's Thomas Church garden, and
  the community legacy behind Ralph D. House Community Park.

- The final high-confidence official-page batch published 16 profiles, bringing
  evergreen coverage to 133 destinations. The workflow also caught a source
  integrity problem: the Hyde–Vallejo facility page was serving copy for
  Washington–Hyde Mini Park, so it was deferred instead of misattributed. With
  the remaining blank and operational pages explicitly queued for alternate
  sources, every confident facility-directory match now has a resolved status.

- Began a separate facility-feature audit after the evergreen writing phase was
  closed. The official directory exposes 106 search options, but only 62 are
  assigned to any of its 361 current listings and 39 appear among the 195
  destinations confidently matched to this product. Initial classification
  found 19 known-label equivalents, nine new durable feature candidates, eight
  accessibility claims requiring a separate freshness model, and three
  operational or unspecific values that should not be published as amenities.

- Published a deliberately narrow first facility-feature enrichment: 81
  assignments across 56 destinations, using only directory labels that map to
  amenity concepts the product already supported. This improved coverage for
  community rooms, athletic fields, ball diamonds, picnic areas, restrooms,
  public art, and similar durable features without introducing new filters,
  accessibility promises, operational claims, or inferred quantities. The
  entire snapshot came from four paginated directory responses rather than
  deep detail-page scraping.

- Reviewed the nine previously unmapped feature concepts. Eight were accepted
  as durable detail-page amenities—Parking, Seating, Trail, Bay Views,
  Gymnasium, Lawn Area, and Pathways, with Panoramic Bay Views consolidated into
  Bay Views. Open Space was excluded because it describes a destination type
  rather than a useful amenity. These additions remain grouped within existing
  visitor-services, gardens-and-nature, and recreation-facility categories.

- Resolved 17 previously ambiguous directory matches through explicit reviewed
  name and location overrides, without weakening the automatic matcher. Broad
  composites such as Golden Gate Park and Mission Bay Park remain unresolved.
  The newly matched cards supplied five additional feature assignments,
  including Amphitheater, Concert Meadow, and Native Plantings. A deterministic
  baseline comparison fixed a snapshot-regeneration bug and now guarantees that
  repeated feature builds retain the full reviewed set.

## Session update: helping residents plan and navigate

- **Transit as practical context:** Added scheduled Muni, BART, and Caltrain
  information from the 511 SF Bay regional feed. Transit data is prepared ahead
  of time, so visitors do not consume paid API calls and the private access
  token never reaches the browser.

- **Decision / limitation:** Destination pages show nearby stops, stations, and
  possible single-line Muni connections from BART or Caltrain. The product does
  not present these suggestions as live directions; residents are sent to the
  relevant transit agency for arrivals, transfers, disruptions, and current
  accessibility information.

- **Search from anywhere:** Added a compact search control to the shared header.
  A resident can begin with a plain search from any page and arrive at the
  existing Explore results with the term already applied, avoiding a separate
  search system or an unnecessary navigation step.

- **Mobile visual entry:** Turned the generated park illustration into a
  temporary homepage background. On mobile, the header and hero occupy the
  first viewport, keeping search and the product purpose focused before the
  activity-browsing section appears on scroll.

- **Long-page navigation:** Added destination-specific anchor links near the top
  of each page. The links collapse into an accessible mobile disclosure and
  include only sections that are actually present.

- **Roadblock / correction:** The first mobile global-search panel inherited
  conflicting width and button-sizing rules, shifting part of the panel beyond
  the viewport and making the submit button unnecessarily tall. Explicit sizing
  restored a full-width, visually distinct panel with consistent controls and
  no horizontal overflow at the 320-pixel support floor.

- **Validation result:** The complete static site builds successfully, the
  automated suite contains 74 passing tests, and focused browser checks cover
  the minimum-width header, global-search flow, transit selector, anchor menu,
  and ultra-wide centering.

## Session update: preparing a shareable project

- **Visual hierarchy:** Iterated on destination-page width, section treatments,
  anchor navigation, and spacing so long pages are easier to scan on phones and
  do not drift toward the edges of ultra-wide displays. The final approach uses
  differences in borders, fills, and nesting rather than relying on several
  barely distinguishable pale colors.

- **Mobile search refinement:** Preserved a two-row primary navigation at the
  320-pixel support floor, including the expanded “Close search” control. The
  search panel now opens as a full-width, blue-tinted surface that is visually
  separate from the page below it.

- **Repository readiness:** Rewrote the project README around setup, validation,
  optional services, and data refreshes. Updated the Git boundary so private
  environment values, large raw downloads, research caches, dependencies, and
  build output remain local, while the reviewed application-ready datasets are
  available to a fresh clone.

- **Current evidence:** The prototype statically generates 249 destination
  pages, contains reviewed evergreen context for 133 destinations, normalizes
  3,314 transit stops and stations across 85 routes, and passes 74 automated
  tests. These are measures of implementation breadth and reliability—not yet
  evidence that residents complete tasks faster or more successfully.

- **Next evidence gap:** A formal accessibility audit and task-based usability
  sessions remain necessary before making comparative claims about improved
  findability, comprehension, or task completion.
