# Product roadmap

## Completed: project updates blog

- Added a static blog index and individual update pages for announcing content
  enrichment, new browsing tools, and other meaningful additions.
- Kept each post in its own version-controlled Markdown file and used Content
  Collections for schema validation, compilation, and typed build output, so
  publishing does not require a CMS, external service, or runtime API calls.
- Added semantic publication dates, page metadata, and a shared navigation link.

## Completed: evergreen destination content

- Expanded reviewed official-page content to 133 destinations and resolved the
  remaining confident directory matches as either published or deferred.
- Publish only durable overview, history, landscape, permanent-highlight, and
  physical-setting content with statement-level provenance.
- Continue evaluating openly licensed image sources separately from content
  extraction.

## Completed: search from anywhere

- Added a compact global search disclosure to the shared header.
- Submissions navigate directly to `/explore` with the search term encoded in
  the existing URL state and reuse the established matching and explanation
  behavior.
- Preserved keyboard operation, explicit labeling, and the mobile homepage's
  full-first-viewport hero composition.

## Completed: homepage visual entry

- Added a full-width hero using the generated park illustration as a temporary
  background with a contrast overlay.
- On mobile, the header and hero occupy the first viewport and the activity
  browsing section begins below the fold.

## Completed: amenity and acreage thresholds

- Added minimum amenity-count and minimum acreage controls to Explore.
- Used acreage published in the official park-property data.
- Summed source-supported area for destinations composed of multiple park
  properties and failed closed when positive size evidence is unavailable.
- Encoded both thresholds in shareable URLs and exposed the matching counts on
  result cards.

## Completed: broad area browsing

- Added nine resident-facing areas above the existing neighborhood and ZIP
  filters, using familiar neighborhood anchors rather than numbered districts.
- Assigned every destination to exactly one reviewed area, including explicit
  handling for Treasure Island, Sharp Park, Camp Mather, and six destinations
  whose source neighborhood labels cross an area boundary.
- Encoded area selections in shareable URLs and reused the established filter
  explanation behavior.

## Next: alternate-source content gaps

- Research authoritative alternate sources for high-value destinations whose
  official facility pages contain no durable descriptive material.
- Keep the existing deferred registry and statement-level review requirements;
  do not weaken automatic matching or publish generic template copy.

## In progress: validation and case-study evidence

- Completed an initial rendered-page accessibility audit across the homepage,
  Explore, a destination page, programs and reservations, and About the data.
  The pass covers landmarks, heading structure, accessible control names, image
  alternatives, duplicate IDs, interactive map and gallery states, keyboard
  focus styling, and 320 CSS pixel reflow.
- Complete screen-reader sessions, text-resize checks, and task-based manual
  keyboard testing before treating the formal accessibility audit as finished.
- Conduct task-based usability sessions and prioritize findings.
- Capture final screens, flows, outcomes, and limitations for the case study.

## Later: additional image providers

- The initial five-destination Pixabay pilot is complete. It produced no exact
  destination photographs and confirmed that broad stock search is a poor fit
  for lesser-known park and recreation locations.
- Keep Pixabay imagery in a separate candidate report because its current
  Content License is not interchangeable with Creative Commons licensing.
- Prefer venue-level photographs, download selected files locally as required
  by the Pixabay API, retain the source record, and reject generic stock imagery
  that does not help residents understand a destination.
- Do not expand Pixabay queries unless a later destination has a distinctive,
  verifiable result that justifies another human-directed search.
