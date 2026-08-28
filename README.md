# SF Parks Explorer

An independent, resident-centered way to explore San Francisco parks,
recreation destinations, amenities, nearby transit, and official next steps.
The site is a statically generated Next.js application built from reviewed
public data; it is not affiliated with or endorsed by the City of San
Francisco.

## What it includes

- Conventional search, activity entry points, filters, and shareable URLs
- Permanent destination pages with amenities and reviewed evergreen context
- MapLibre results and optional Google Maps embeds
- Build-time Muni, BART, and Caltrain guidance from 511 SF Bay
- Official program and reservation handoffs
- Keyboard-accessible, responsive layouts supporting 320 CSS pixels and wider

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open <http://localhost:4173>. To validate and produce the static export:

```sh
npm test
npm run check
npm run build
```

The deployable static site is written to `out/`.

## Optional configuration

Copy `.env.example` to `.env.local` and add only the services you intend to
use. The Google Maps key is used by the browser and must be restricted to the
Maps Embed API and approved website referrers. The 511 and Pixabay tokens remain
server-side and must never use a `NEXT_PUBLIC_` prefix.

The application builds without optional map keys. The committed normalized,
presentation, and search datasets allow a fresh clone to run without repeating
the source imports.

## Refresh data

Raw downloads are intentionally excluded from Git because they are large and
reproducible. Approved DataSF sources can be imported with:

```sh
npm run import:datasf -- datasf-rec-park-properties
npm run normalize
npm run build:destinations
npm run build:search
```

Refresh scheduled regional transit data with:

```sh
npm run import:transit
npm run normalize:transit
```

All sources must be declared and approved in `data/sources.json`. Validate that
registry with `npm run validate:sources` before publishing refreshed data.

## Project documentation

- [Product roadmap](docs/product-roadmap.md)
- [Data governance](docs/data-governance.md)
- [Search and filter specification](docs/search-and-filter-specification.md)
- [Evergreen content policy](docs/evergreen-content-enrichment-policy.md)
- [Imagery policy](docs/imagery-enrichment-policy.md)
- [Case-study notes](docs/case-study-notes.md)
- [First-person blog-post draft](docs/blog-post-draft.md)
