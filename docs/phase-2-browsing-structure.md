# Phase 2: browsing structure

Status: Draft informed by reported user pain  
Date: August 26, 2026

## Research input

This phase uses Emma Silvers's August 24, 2026 Coyote Media article, “San
Francisco’s Parks Are Incredible. Why Is the Rec and Park Website So Bad?” as a
reported source of user pain:

https://www.coyotemedia.org/san-francisco-rec-park-website-bad/

The article is reported journalism and a first-person essay, not a formal
usability study. Its examples are treated as hypotheses and task scenarios to
validate, not as statistically representative findings.

## Browsing pain points identified

### Users begin with a place or question, not a department structure

The article describes a resident who lives near Kezar Stadium and wants to know
what is happening there, whether an event is open to the public, and whether a
ticket is needed. It also describes difficulty finding actual Bandshell
programming after several clicks.

**Requirement:** Search must support known-place entry and lead directly to a
destination. A destination must present available information, information
gaps, and relevant official next actions together rather than forcing the user
to choose a source system first.

### Navigation paths end in descriptions rather than answers

Residents can reach pages that establish that concerts, facilities, or
activities exist without finding the schedule, participation rules, or next
step they sought.

**Requirement:** Every destination detail page needs an explicit “What you can
do here” section and an “Official information and next steps” section. When the
MVP lacks schedules or events, it must say so directly and provide the best
known official link rather than imply that a general description answers the
question.

### The site behaves like several unrelated websites

The article characterizes the experience as multiple interfaces nested together,
including specialized registration and reservation systems. Users lose context
when moving among them.

**Requirement:** The MVP uses one stable hierarchy:

```text
Home → Results → Destination → Official next action
```

External handoffs must be labeled before navigation, open the deepest reliable
official URL, and make clear that the user is leaving the independent explorer.
The explorer must never imitate an official transaction interface.

### Users must repeatedly hunt and backtrack

Examples include several clicks to find incomplete Bandshell information,
community-discovered registration paths, and a climbing-wall reservation path
described as buried within the site.

**Requirement:** Search and filter state must survive destination visits and be
encoded in the URL. Returning to results must preserve the query, filters,
sort, and list position. Official-action links must be grouped consistently on
every destination.

### Mobile browsing can fail on basic content pages

The article reports a trail-information page that went blank when scrolled on a
phone, even after waiting and reloading.

**Requirement:** The list, filters, and destination details must be usable with
server-rendered or static HTML before optional map behavior loads. Core content
must not depend on client-side map code, animation, or a large JavaScript bundle.

### People fall back to physical signs and informal resources

Residents reportedly use fence posters, QR-linked PDFs, WhatsApp groups, flyers,
and community-created websites because official online paths are incomplete or
hard to locate.

**Requirement:** Destination pages should support multiple official resource
types—webpage, schedule, PDF, registration, reservation, or maintenance report—
under clearly named actions. A PDF must be labeled as a PDF. The product should
not assume that the general facility page is always the most useful link.

### Non-English users have difficulty discovering content

The article reports that the official site is indexed primarily in English and
that its language selector lists languages in English, while the unofficial
alternative attracted substantial non-English use.

**Requirement:** Navigation and taxonomy labels must be designed for
localization from the beginning. Language names must be shown in their native
form. URLs must not depend on English labels as identifiers. The English MVP
must not claim multilingual support before translations are reviewed.

### Time pressure magnifies browsing friction

Registration examples involve scarce inventory, advance preparation, multiple
tabs, and failure costs measured in lost access to affordable programs.

Registration is outside this MVP, but discovery must not add avoidable friction
before the handoff.

**Requirement:** Official actions should be reachable from the destination
without another search. Links must state their purpose and whether the explorer
can verify that they are current. The interface must not require an account for
discovery, saved URL state, or source verification.

## Proposed information architecture

### Global navigation

Keep the primary navigation deliberately small:

- **Explore:** search and browse all destinations;
- **Activities:** familiar activity entry points that create filtered results;
- **About the data:** coverage, provenance, independence, and limitations.

Do not create separate primary sections for properties, facilities, functional
areas, assets, or source systems.

### Home page

The home page should prioritize a search field followed by activity entry
points.

#### Primary search

Label: **Find a park or recreation destination**

Supporting text: Search by place, neighborhood, activity, or amenity.

The search must match:

- public destination names;
- retained source names and aliases;
- neighborhood, address, and ZIP code;
- public amenity labels;
- original City amenity terminology; and
- reviewed synonyms.

#### Activity entry points

- Play with kids
- Have a picnic
- Play sports
- Exercise
- Swim
- Bring a dog
- Visit a garden or natural area
- Find a recreation center
- See arts and cultural features

Each entry point is a transparent filter preset. It must lead to the same result
interface as search rather than a separate microsite.

#### Location entry

Offer neighborhood and ZIP-code selection without requiring location
permission. “Near me” can be added later as an optional action with a clear
permission request.

**Implementation status:** Neighborhood and ZIP-code facets are available as
explicit, shareable filters. Location permission and distance sorting remain
deferred.

### Results page

The list is the primary result surface. A map is synchronized secondary context
and must be optional.

For the first map implementation, prefer MapLibre with a reviewed managed tile
provider. Load the mapping library and tiles only after the resident requests
the map. Keep provider attribution visible and retain the list as the complete,
accessible browsing surface. Google Maps Embed remains suitable for a simple
single-destination map, but is not the preferred foundation for a synchronized
multi-result explorer.

The page includes:

- query and result count;
- active filter chips;
- accessible filter controls;
- list-first results;
- optional map toggle;
- sort by relevance, name, or distance when a location is available; and
- clear incomplete-coverage language for empty results.

Selecting a destination preserves the results URL and return position.

### Destination page

Use this stable order:

1. public name, place type, neighborhood, address, and map link;
2. why it matched the current search, when arriving from results;
3. resident-facing amenities;
4. meaningful subplaces such as park and recreation center;
5. official information and next actions;
6. coverage and freshness explanation; and
7. expandable source details.

Internal source sections and identifiers belong only in expandable source
details unless the user searched for one directly. In that case, show a concise
notice explaining the public grouping.

## No-dead-end rule

Every result must lead to a destination page containing at least:

- the information that caused it to match;
- its coverage status;
- its authoritative DataSF source; and
- the best reviewed official public link, when one is known.

If no public page has been reviewed, say so. Do not substitute an unrelated
department homepage merely to ensure that a link exists.

## Browse-state requirements

The URL must be capable of representing:

- text query;
- selected activity or amenities;
- neighborhood or ZIP code;
- location and distance, when explicitly supplied;
- sort order;
- list or map preference; and
- result page or cursor.

Browser Back must restore the prior result state without rebuilding the user's
search from memory.

## Phase 2 validation scenarios

1. A user searching “Kezar Stadium” reaches one destination and can immediately
   see whether current event information is available or missing.
2. A user selecting “Play with kids” and “Have a picnic” reaches one combined
   result list rather than two browsing silos.
3. A search for an internal Golden Gate Park section reaches Golden Gate Park
   with a grouping explanation.
4. A mobile user can search, filter, open a destination, and return to the same
   result state at a viewport width of 320 CSS pixels without unintended
   horizontal overflow, with the optional map disabled.
5. A user can distinguish a general official facility page from a registration,
   reservation, schedule, PDF, or maintenance link before selecting it.
6. A user can understand that no matching result may reflect incomplete data,
   not confirmed absence.
7. A non-English language selector, when implemented, displays language names
   in their native form and preserves the current destination or result state.

## Phase 2 boundary

This phase defines how residents enter, browse, retain context, and reach a
destination or official handoff. It does not design the registration experience,
promise current programming data, or add automated webpage extraction.
