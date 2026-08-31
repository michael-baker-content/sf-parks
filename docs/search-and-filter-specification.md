# Search and filter specification

Status: Phase 2 implementation contract  
Date: August 26, 2026

## Search scope

Search is conventional and token-free. It operates over a generated local index
of public destinations and must not call an AI model or scrape a source page at
request time.

Searchable fields are:

1. public destination name;
2. retained names, internal section names, and reviewed aliases;
3. neighborhood;
4. address and ZIP code;
5. resident-facing amenity labels; and
6. original City amenity terminology retained as synonyms.

## Text normalization

Queries and indexed fields are normalized consistently:

- Unicode NFKD normalization;
- removal of combining accents;
- lowercase conversion;
- `&` expands to `and`;
- punctuation becomes spaces; and
- repeated whitespace collapses.

The MVP supports exact, prefix, and token matching. Typo correction and fuzzy
matching are deferred until real query logs or usability testing demonstrate a
need.

## Ranking order

When a text query is present, rank signals in this order:

1. exact public-name match;
2. public-name prefix match;
3. exact retained-alias match;
4. alias prefix match;
5. all query tokens present in the public name;
6. exact amenity or activity term match;
7. exact neighborhood, ZIP code, or address match;
8. all query tokens present elsewhere in the combined index; and
9. alphabetical public name as the stable tie-breaker.

An internal Golden Gate Park section therefore resolves to the combined Golden
Gate Park destination without exposing the section as a separate result.

When no text query is present, sort alphabetically by default. Distance sorting
is available only after the user explicitly supplies a location.

## Filter semantics

- Selected amenities use **AND** logic: Playground + Restrooms requires positive
  evidence for both.
- Selected activity presets use **AND** logic when a user combines them: Play
  with kids + Have a picnic requires each preset to match.
- Alternative terms inside one preset use **OR** logic.
- Multiple neighborhoods use **OR** logic.
- Multiple broad areas use **OR** logic. Every destination belongs to exactly
  one reviewed area; areas are transparent browsing groups rather than official
  administrative boundaries.
- A source value containing multiple comma-separated neighborhoods contributes
  each neighborhood as an individual filter value while retaining the complete
  source wording for display and search.
- Multiple place types use **OR** logic.
- Coverage values use **OR** logic.
- Minimum amenity count requires at least that many distinct listed amenity
  labels.
- Minimum park size compares the threshold with acreage published in the
  official park-property dataset. Multi-property destinations sum their member
  property areas; a future record with incomplete area coverage fails closed.

Filtering uses positive evidence. A destination excluded by a filter is not
certified to lack that feature.

## Activity presets

Activity presets are transparent saved filters defined in
`data/search/search-filters.json`. They all lead to the same results interface.

- Play with kids
- Have a picnic
- Play sports
- Exercise
- Swim
- Bring a dog
- Visit a garden or natural area
- Find a recreation center
- See arts and cultural features

The interface should be able to explain which amenity labels or categories make
each preset match.

## Facets

The generated search index publishes counts for:

- activities;
- individual amenities;
- neighborhoods;
- place types; and
- coverage status.

Do not display a zero-count option after other filters are applied unless it is
already selected. Counts describe listed data coverage, not verified citywide
inventory.

## URL contract

Use repeatable, human-readable parameters:

```text
/explore?q=tennis&activity=play-sports&amenity=restrooms&area=sunset-westside&minAmenities=5&minAcres=1&sort=relevance&view=list
```

Supported parameters:

- `q`: text query;
- `activity`: repeatable activity ID;
- `amenity`: repeatable amenity ID;
- `area`: repeatable broad-area ID;
- `neighborhood`: repeatable neighborhood ID;
- `place`: repeatable place-type ID;
- `coverage`: repeatable coverage ID;
- `minAmenities`: non-negative minimum count of distinct listed amenities;
- `minAcres`: non-negative minimum park-property area in acres;
- `near`: user-supplied coordinate or resolved place identifier;
- `distance`: distance radius used with `near`;
- `sort`: `relevance`, `name`, or `distance`;
- `view`: `list` or `map`; and
- `page`: positive result-page number.

Unknown parameters are ignored. Invalid known values are removed with an
accessible notice. Browser Back restores the URL-defined state.

## Empty and partial states

No-results language:

> No destinations are currently listed with all selected features. This may
> reflect incomplete data rather than confirmed absence.

Offer filter relaxation in this order:

1. remove the most recently added amenity;
2. expand or remove location constraints;
3. remove a place-type constraint; and
4. show destinations matching any selected amenity.

Never silently change AND logic to OR logic.

## Index artifact

`npm run build:search` produces:

`data/search/generated/search-index.json`

The artifact contains normalized searchable fields, exact filter values, and
facet counts. It contains no user information and requires no network access at
runtime.
