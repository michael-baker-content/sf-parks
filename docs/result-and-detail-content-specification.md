# Result and destination content specification

Status: Phase 2 implementation contract  
Date: August 26, 2026

## Purpose

This specification defines what residents see after searching and how a
destination explains its amenities, subplaces, information coverage, and
official next actions.

The interface must answer:

1. What is this place?
2. Where is it?
3. Why did it match?
4. What information is supported?
5. What remains incomplete?
6. Where can the user verify details or continue officially?

### Editorial naming rule

Do not use “City” or “County” alone as the first reference to San Francisco in
a text block. Use “City of San Francisco” first; a shorter “City” reference may
follow when its meaning is clear. The full legal name “City and County of San
Francisco” is also sufficiently specific where appropriate.

## Result-card contract

Every result card contains:

- public destination name;
- place type when useful;
- neighborhood and address or a location fallback;
- amenities responsible for the current match;
- up to four visible amenity labels;
- a `+N more` disclosure when additional amenities exist;
- exact quantities only when `quantityStatus` is
  `official-page-verified`;
- coverage label;
- distance only when the user supplied a location; and
- a link to the destination detail page.

### Match explanation

Matched amenities appear before general featured amenities. A card reached by
the filters Playground + Restrooms should say:

```text
Matches: Children's Play Area · Restrooms
```

Do not make residents compare an undifferentiated amenity list to their active
filters.

### Quantity display

Allowed:

- `6 tennis courts` when an official page verifies six;
- `Tennis Court` when listed without a verified count; and
- `Benches available` when maintenance inventory supports presence.

Not allowed:

- converting source component counts into public inventory;
- implying all listed assets are usable now; or
- displaying zero when a feature is merely unlisted.

### Coverage labels

Use exactly:

- **Official page reviewed**

Coverage language must remain secondary to the result's name and match, but it
must be available without opening source details.

## Result-card example

```text
Mission Dolores Park
Castro / Upper Market · 19th and Dolores Street

Matches: Children's Play Area · Picnic Area · Restrooms
6 tennis courts · 2 dog-play areas · +7 more

Official page reviewed
View details →
```

The precise amenities shown after the match are determined by the configured
group order, not by maintenance-record counts.

## Destination-detail hierarchy

### 1. Identity

- public name;
- destination or place type;
- neighborhood;
- address;
- optional map link; and
- distance only when derived from a user-supplied location.

### 2. Why it matched

Show only when the user arrived with search or filter state. Preserve the same
terminology used on the result card.

### 3. Amenities

Group amenities in this order:

1. Playgrounds and kids
2. Picnic
3. Sports
4. Fitness
5. Swimming
6. Dog play
7. Recreation facilities
8. Gardens and nature
9. Arts and culture
10. Visitor services

Hide empty groups. Show quantities and quantity explanations according to the
evidence rules. Do not expose raw facility or asset counts in the primary view.

### 4. Subplaces

Show this section only when the public destination contains meaningful
subplaces, such as a park and recreation center.

Each subplace may carry its own:

- source name;
- type;
- address or location;
- amenities;
- hours, when later enriched; and
- official link.

Internal Golden Gate Park sections are not ordinary public subplaces. They
appear only in expandable source details unless a resident searched for a
section name or identifier. In that case, show:

> This source name is part of the combined Golden Gate Park destination.

### 5. Official information and next steps

Official actions must describe their destination before the user selects them:

- View official facility page
- View official Parks information
- View official schedule
- Continue to official registration
- Continue to official reservations
- Open official PDF
- Report an issue through the official service

Do not use vague labels such as “Learn more,” “Click here,” or “Continue.” A PDF
must be labeled as a PDF. Registration and reservation links must not look like
actions completed within the explorer.

Before an external handoff, the interface must communicate:

> You are leaving this independent explorer and continuing on an official or
> linked service.

This may be persistent helper text rather than a blocking dialog.

When no destination-specific official page has been reviewed, say:

> No destination-specific official page has been reviewed yet.

Do not fill the gap with an unrelated department homepage.

### 6. Coverage and freshness

For official-page-reviewed destinations:

> Some details were checked against a linked SF Recreation and Parks page.

> Features not shown may still be available. Verify important details on the
> official page.

For open-data-only destinations:

> Details come from City-published open data and may not include every public
> feature.

> Not listed does not mean unavailable. No official page has been used to
> enrich the listed features yet.

Include the applicable retrieval or review date when available.

### 7. Source details

An expandable source section includes:

- contributing property and facility names;
- hidden source aliases when relevant;
- DataSF source identifiers and URLs;
- official-page enrichment URL and review date;
- quantity evidence status; and
- presentation-review reason for grouped destinations.

This information is essential for trust but should not interrupt the ordinary
resident task.

## Empty and uncertain information

Never render a missing field as `No`, `None`, or `Not available` unless an
authoritative source explicitly states absence.

Preferred terms:

- Not listed
- Exact quantity not verified
- Location details not listed
- No official page reviewed yet
- Current schedule not available in this explorer

## Independence notice

The global footer uses:

> Uses public data published by the City and County of San Francisco through
> DataSF. This independent application is not affiliated with or endorsed by
> the City. Verify important details with the linked official source.

## Accessibility requirements

- Result cards use a real heading and one descriptive destination link.
- Coverage must not be communicated by color alone.
- Amenity groups use semantic headings and lists.
- External actions identify their purpose in accessible text.
- The `+N more` control exposes the additional amenities to assistive
  technology.
- Returning from a detail page restores focus to the originating result.
- Dynamic result counts and filter changes use a polite live region.

## Validation scenarios

1. A user can state why a result matched without opening its detail page.
2. A user does not interpret an unverified asset count as guaranteed inventory.
3. A user distinguishes a park from a recreation-center subplace.
4. A user recognizes a PDF, schedule, registration, or reservation handoff
   before selecting it.
5. A user can explain the difference between open-data-only and official-page-
   reviewed coverage.
6. A user does not interpret an omitted amenity as confirmed absence.
