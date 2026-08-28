# Representative property audit

Reviewed August 26, 2026 against the current normalized snapshots and public
SF Recreation and Parks pages. This is a product-quality audit, not an
independent site inspection.

## Review principles

- Prefer the name and grouping familiar from the public Parks site when internal
  asset-management structure would confuse residents.
- Treat repeated facility, functional-area, and asset records as evidence, not
  automatically as separate public amenities.
- Preserve discrepancies in the quality report and use official-page enrichment
  where open data cannot express a familiar feature.

## Golden Gate Park

### Normalized result

The open data represents Golden Gate Park as seven properties named “Golden
Gate Park - Section 1” through “Golden Gate Park - Section 7.” Collectively they
contain 391 canonical facilities, including 90 currently mapped to public
categories.

### Public-site comparison

The Parks site presents Golden Gate Park as one 1,017-acre park and organizes
activities and points of interest beneath that identity. It does not ask
residents to choose an internal section.

- https://www.sfrecpark.org/1865/Golden-Gate-Park-Activities
- https://sfrecpark.org/684/Points-of-Interest

### Finding

Create a curated virtual property called **Golden Gate Park** that groups the
seven source properties. Preserve section IDs internally for relationships and
provenance, but do not show the sections as top-level search results by default.

Counts such as 77 functional-area restroom records and 33 indoor recreational
areas should not be displayed directly. They describe components, rooms, or
maintenance records rather than 77 resident-facing restroom destinations.

## Mission Dolores Park

### Normalized result

The normalized data identifies basketball, a children's play area, dog play,
multi-use paved space, picnic space, restrooms, and tennis. Functional-area
records identify six tennis courts and two dog-play areas.

### Public-site comparison

The official page describes a soccer field, six tennis courts, one basketball
court, a multi-use court, a playground, two off-leash dog-play areas, picnic
space, and restrooms.

- https://www.sfrecpark.org/Facilities/Facility/Details/Mission-Dolores-Park-188
- https://www.sfrecpark.org/Facilities/Facility/Details/Mission-Dolores-Park-Dog-Play-Areas-21

### Finding

This is a strong match and a useful regression fixture. Facility and functional
area records should collapse into one resident-facing feature per recognizable
amenity, while retaining an optional source-supported quantity such as “6
tennis courts” or “2 dog-play areas.”

The current normalization also has both “Picnic Area” and “Table Seating Area.”
For discovery, these should roll up to **Picnic Area**, with the source labels
retained in provenance.

## Glen Canyon Park and Recreation Center

### Normalized result

The data identifies the park, recreation center, ball field, children's play
area, clubhouse, natural area, picnic area, and tennis. Indoor functional areas
are classified generically as “Indoor Recreation Area.”

### Public-site comparison

The official page uses the public name **Glen Canyon Park Recreation Center**
and lists additional familiar features and activities, including basketball,
indoor pickleball, ping pong, a climbing wall, community rooms, fitness uses,
and scheduled drop-in activities.

- https://www.sfrecpark.org/Facilities/Facility/Details/Glen-Park-Rec-Center-89

### Finding

Open data gives us a reliable physical foundation but cannot fully represent
the public facility experience. “Indoor Recreation Area” should not be expanded
into invented activities. The official facility page is an appropriate future
enrichment source for features, hours, and schedules, each with separate
provenance and freshness.

The normalized label “Glen Canyon Rec Center” should be presented using the
familiar official-page name, **Glen Canyon Park Recreation Center**, through an
audited override or page enrichment—not by altering source data.

## Mission Recreation Center

### Normalized result

The property is named “Mission Rec Center,” with a recreation center,
arts/activity center, children's play area, multi-use turf, indoor recreational
areas, restrooms, and a soccer functional area.

### Finding

This is a good example of a property whose principal facility is more important
to residents than the underlying property container. Search should return the
recreation center as the primary result and avoid showing a nearly identical
property card alongside it.

The public label should prefer “Recreation Center” over the abbreviated “Rec
Center” in headings while retaining the official/source name where it is used
as a proper name.

## Douglass Playground

### Normalized result

The normalized data identifies a children's play area, basketball court,
clubhouse, dog-play area, picnic area, restroom, and tennis court.

### Public-site comparison

The official page lists an athletic field and baseball diamond in addition to
the features above. The picnic page also describes two reservable tables,
capacity, clubhouse, restroom, basketball, and tennis information.

- https://sfrecpark.org/facilities/facility/details/Douglass-Playground-237
- https://sfrecpark.org/815/Douglass-Playground-Picnic-Area

### Finding

The normalized open data is directionally accurate but incomplete. The missing
athletic-field/baseball feature should be added only through an official-page
enrichment record, not inferred from unrelated geometry or names.

Reservation details are volatile and should retain their own retrieval time and
link directly to the official reservation workflow.

## Rules implied by this audit

1. Support curated virtual properties for familiar public groupings, beginning
   with Golden Gate Park.
2. Collapse facility and functional-area evidence into resident-facing amenity
   concepts rather than displaying both as duplicates.
3. Treat quantities as trustworthy only when supported by distinct source
   components or an official public page.
4. Use asset counts to establish likely presence, not to promise exact public
   inventory.
5. Prefer principal resident-facing facilities over duplicate property cards.
6. Maintain official-page enrichment as a separate provenance layer with its
   own freshness and rights review.
7. Use Mission Dolores Park as a regression fixture because its normalized
   amenities align closely with its public page.

