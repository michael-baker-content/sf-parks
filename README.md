# SF Parks Explorer

An independent, resident-centered way to explore San Francisco parks,
recreation destinations, amenities, nearby transit, and official next steps.
The site is a statically generated Next.js application built from reviewed
public data; it is not affiliated with or endorsed by the City of San
Francisco.

## What it includes

- Conventional search, 12 activity entry points, nine broad browsing areas,
  collapsible filters, shareable URLs, minimum amenity and acreage thresholds,
  and 15-result progressive batches
- Permanent destination pages with amenities and reviewed evergreen context
- MapLibre results with two-size destination markers and optional Google Maps
  embeds
- Build-time Muni, BART, and Caltrain guidance from 511 SF Bay
- Official program and reservation handoffs
- A static project blog for announcing destination enrichment and product updates
- A rotating set of four image-supported featured parks selected from ten
  detailed destinations on each homepage load
- Statement-level source links, with a scannable panel when an overview uses
  multiple references
- Keyboard-accessible, responsive layouts supporting 320 CSS pixels and wider

The current accessibility baseline and remaining manual checks are documented
in [`docs/accessibility-audit.md`](docs/accessibility-audit.md).

## Publish a blog update

Create one Markdown file in `content/blog/`. Its filename becomes the page
address, and the opening front matter supplies the title, summary, and date.
Posts use standard Markdown, including headings, emphasis, links, quotations,
and lists. Optional `actionLabel` and `actionHref` fields add a closing
call-to-action button. Content Collections validates the front matter, compiles
the Markdown, and generates the typed content used by the blog index and
individual static pages during the next build.

## Current project status

- 249 statically generated destination pages
- Official-page review complete for every destination: 209 enriched, 29
  reviewed with no additions, and 11 without a matching official page
- 198 destinations with approved evergreen narrative records; the broader
  enriched total also includes reviewed facility-directory features
- 3,314 transit stops and stations across 85 routes
- 40 approved images across 23 destinations, with a generic placeholder used
  elsewhere rather than an unverified location image
- 2 generated editorial illustrations supporting the programs and reservations
  guide
- Official park-property area available for all 249 public destinations
- 116 passing automated tests, plus a successful TypeScript check and static
  production build

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

## Vercel and optional configuration

The deployed static site needs no required environment variables. To enable the
on-demand Google Maps embed, add `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` in
Vercel and restrict the key to the Maps Embed API and approved website
referrers. The results map uses the project's reviewed OpenFreeMap style and
does not require configuration.

Do not add `511_API_KEY`, `SF_PARKS_CONTACT`, or `PIXABAY_API_KEY` to Vercel.
Those values are used only by local data-maintenance scripts, not by the public
site or production build. The committed normalized, presentation, and search
datasets allow Vercel and a fresh clone to build without repeating imports.

## Prepare and upload images

Approved images can be prepared locally and delivered from a public Vercel Blob
store. Camera originals should remain in a separate personal archive. The
repository retains the reviewed attribution records and the generated delivery
URLs, but not future batches of binary photographs.

Create a public Blob store for the Vercel project, then pull its
`BLOB_READ_WRITE_TOKEN` into `.env.local`. Place a reviewed batch temporarily
in the ignored `public/media/` intake directory. Prepare responsive WebP
variants and upload the immutable, content-hashed files with:

```sh
npm run prepare:blob-images
npm run upload:blob-images
```

The preparation report is ignored as reproducible output. The upload command
updates `data/media/blob-assets.json`, which is intended to be committed after
the uploaded images have been reviewed in the site. Image delivery is resolved
during the static build, so expanding the registry does not send the complete
catalog to interactive browser components. After upload and verification,
archive the source photographs outside the repository and clear the local
intake directory; the application does not require those source files.

Blog posts use the park illustration by default. To choose another reviewed
Blob asset for a post card, add its stable registry path and meaningful alt text
to the Markdown frontmatter:

```yaml
image:
  path: /media/alamo-square-01.jpg
  alt: View across Alamo Square's lawn toward surrounding homes.
```

The path must already exist in `data/media/blob-assets.json`; an unknown path
fails the production build rather than publishing a broken image.

To add a slideshow to a post, list two or more reviewed image paths. Captions,
alt text, creator credits, source links, and licenses are inherited from
`data/media/media-manifest.json`:

```yaml
gallery:
  - /media/alamo-square-01.jpg
  - /media/sigmund-stern-recreation-grove-01.jpg
```

## Refresh data

Raw downloads are intentionally excluded from Git because they are large and
reproducible. Approved DataSF sources can be imported with:

```sh
npm run import:datasf -- datasf-rec-park-properties
npm run normalize
npm run build:destinations
npm run build:search
```

Normalization performs a coordinate-evidence review on every refresh. A usable
source point is retained when it falls inside—or within 0.5 mile of a
representative point derived from—the record's official geometry. A missing,
null-island, or seriously displaced point is replaced with a deterministic
point inside that geometry and recorded under `coordinateCorrections` in
`data/normalized/normalization-report.json`. If neither form of evidence is
usable, the destination receives no map or directions links. The application
does not use an undocumented hand-entered coordinate.

Refresh scheduled regional transit data with:

```sh
npm run import:transit
npm run normalize:transit
```

For local refreshes, place `511_API_KEY` in `.env.local`, provide
`SF_PARKS_CONTACT` when running DataSF imports, and add `PIXABAY_API_KEY` only
when intentionally rerunning the deferred image-discovery pilot. These private
values must not use a `NEXT_PUBLIC_` prefix.

All sources must be declared and approved in `data/sources.json`. Validate that
registry with `npm run validate:sources` before publishing refreshed data.
Regenerate the destination-review summary with:

```sh
npm run report:official-page-review
```

The report distinguishes published enrichment, completed reviews with no useful
additions, missing official pages, and genuinely pending work. A completed
“no additions” result is not an unfinished review.

## Project documentation

- [Product roadmap](docs/product-roadmap.md)
- [Data governance](docs/data-governance.md)
- [Search and filter specification](docs/search-and-filter-specification.md)
- [Evergreen content policy](docs/evergreen-content-enrichment-policy.md)
- [Imagery policy](docs/imagery-enrichment-policy.md)
- [Case-study notes](docs/case-study-notes.md)
- [First-person blog-post draft](docs/blog-post-draft.md)
