# SF Parks Explorer MVP product brief

Status: Approved baseline  
Date: August 26, 2026

## Product statement

SF Parks Explorer helps residents find a San Francisco park or recreation
destination that fits what they want to do, where they want to go, and the
facilities they need.

It reorganizes official public information around resident tasks while linking
back to the authoritative City source. It is an independent discovery tool, not
a City service, registration system, reservation system, or guarantee of
current availability.

## The problem

Residents should not have to understand Recreation and Parks' internal property
structure, asset-management vocabulary, or separate vendor systems before they
can answer ordinary questions such as:

- Where can I take a child to play and have a picnic?
- Which nearby parks have tennis courts?
- Is there a recreation center at this park?
- Does this location list restrooms or an off-leash dog area?
- Where can I verify the information or take the next official action?

The MVP addresses discovery and comprehension. It does not replace official
transactions.

## Primary audience

San Francisco residents and visitors looking for a park, playground,
recreation center, sports facility, or related public amenity.

The design must not assume familiarity with City departments, datasets,
facility identifiers, internal park sections, or asset-management terms.

## Primary user outcomes

A user can:

1. Find destinations by public name, neighborhood, address, ZIP code, activity,
   or amenity.
2. combine location and amenity requirements without knowing the City's source
   taxonomy.
3. understand why each destination matched the search.
4. distinguish a combined destination's meaningful subplaces, such as a park
   and recreation center.
5. distinguish verified quantities from source-listed presence.
6. understand when information coverage is incomplete.
7. reach the relevant official source to verify details or continue a task.

## MVP capabilities

### Destination discovery

- Search all generated public destinations.
- Match familiar public names and retained source aliases.
- Filter by resident-facing amenities and location.
- Return combined destinations instead of internal or duplicate source records.
- Preserve a usable list experience without requiring a map.

### Result comprehension

- Show the public destination name, neighborhood, and approximate location.
- Explain which requested amenities caused a result to match.
- Show only officially verified quantities as exact counts.
- Present source-inventory evidence as presence, not guaranteed availability.
- Clearly label open-data-only and official-page-reviewed coverage.

### Destination details

- Group amenities using familiar Parks terminology.
- Expose meaningful subplaces when their hours, rules, or identity may differ.
- Link to official City pages where available.
- Provide accessible provenance and freshness information.
- Explain that missing information is not evidence of absence.

### Shareable state

- Preserve searches and filters in the URL.
- Allow a user to share or revisit the same result set.

## Explicit non-goals

The MVP will not:

- register users for classes or programs;
- make, modify, or cancel reservations;
- process payments, permits, or user accounts;
- claim live facility, program, or reservation availability;
- depend on generative AI or per-query model tokens;
- provide personalized recommendations based on user profiles;
- scrape webpages while a resident waits for results;
- guarantee hours, accessibility, safety, or amenity availability;
- expose maintenance-only records as individual public destinations;
- reproduce every feature of the official Parks site.

The application may link to official registration, reservation, maintenance,
or information workflows.

## Product principles

### Resident language first

Prefer public Parks terminology and familiar place names. Preserve original
source terms for search and provenance, but do not force residents to learn
them.

### No invented certainty

Never infer an amenity, quantity, relationship, operating status, or
accessibility feature merely because it seems likely. Clearly distinguish:

- official-page verified;
- source-listed;
- incomplete or not listed; and
- unresolved.

### Missing is not absent

The interface must not represent a missing source value as a confirmed “No.”
Filtering includes positively supported matches; it does not certify that
excluded destinations lack the selected feature.

### Official actions remain official

When a user needs current details, registration, reservations, permits, or
maintenance reporting, route them to the authoritative system.

### Useful without AI

Structured filters, conventional text search, synonyms, and ranking must provide
the complete core experience. AI is not an architectural dependency.

### Accessible without a map

Every discovery and verification task must be possible from semantic controls,
lists, and detail content. A map is an enhancement, not the sole interface.

## Trust and independence language

The global interface must include:

> Uses public data published by the City and County of San Francisco through
> DataSF. This independent application is not affiliated with or endorsed by
> the City. Verify important details with the linked official source.

Result and detail views must show the relevant source and coverage status without
making provenance dominate the primary task.

## MVP acceptance scenarios

The product is functionally successful when a user can complete all of the
following without understanding the source datasets:

1. Find destinations listing a playground, picnic area, and restrooms.
2. Find destinations listing tennis near a chosen neighborhood.
3. See that Mission Dolores Park has six officially verified tennis courts.
4. Search for “Golden Gate Park - Section 4” and reach the combined Golden Gate
   Park destination with an explanation of the grouping.
5. Distinguish Glen Canyon Park from its recreation-center subplace within one
   destination.
6. Recognize that an unlisted amenity may reflect incomplete coverage rather
   than confirmed absence.
7. Follow the official source for Douglass Playground's baseball diamond.

## Initial success measures

During task-based testing:

- At least 80% of participants complete each core discovery task.
- At least 80% correctly distinguish “not listed” from “not available.”
- At least 80% can identify which information is officially page-verified.
- At least 80% can reach the official source from a destination detail view.
- No participant should need to understand “functional area,” “asset,” or an
  internal Golden Gate Park section to complete an ordinary resident task.

These are prototype validation targets, not claims about a statistically
representative population.

## Scope-change test

A proposed MVP feature belongs in scope only if it materially improves at least
one primary user outcome and does not require the application to perform an
official transaction or make an unsupported claim.

Features that fail this test should be deferred or represented as links to the
official system.

## Phase 1 completion criteria

Phase 1 is complete when:

- the product statement and audience are accepted;
- primary outcomes are explicit;
- MVP capabilities and non-goals are recorded;
- trust and data-coverage principles are mandatory;
- acceptance scenarios are testable; and
- later design decisions can be evaluated against this document.

