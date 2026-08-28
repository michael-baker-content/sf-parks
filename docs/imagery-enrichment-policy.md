# Imagery enrichment policy

## Purpose

Destination photography can help residents recognize a place, but an image is
not required for discovery and must never imply a facility, condition, or
accessibility feature that has not been verified. Imagery is a separate
presentation enrichment layer rather than part of the DataSF inventory.

## DataSF audit

The four imported Recreation and Parks datasets were audited on August 26,
2026. None contains an image, photo, thumbnail, media, or media-URL field.
Their PDDL licensing therefore does not establish reuse rights for photographs
found elsewhere on an SF Recreation and Parks webpage.

## Initial source strategy

Use Wikidata only to discover candidate Wikimedia Commons files. A Wikidata
`image` (`P18`) value identifies a Commons media file but does not replace the
file's own license and attribution requirements.

Candidate discovery and metadata refreshes must run as build-time or scheduled
scripts. The public interface must not query Wikidata or Commons while a
resident waits for a page. Requests must be narrowly scoped, cached, and carry
an identifying user agent in accordance with Wikimedia API guidance.

Do not scrape photographs from SF Recreation and Parks pages unless a separate
source review establishes permission to reproduce each image. A page being
publicly viewable is not sufficient reuse permission.

LocalWiki may be used as a complementary candidate source through its public,
read-only API. Its default media license is CC BY 4.0, but LocalWiki also permits
images with individually noted copyright or incompatible license terms. Review
the source page, image caption, and available contribution history for every
candidate. Publish only when no exception overrides the default license, and
credit “LocalWiki Contributors” with a link to the source page unless a more
specific compatible attribution is supplied. Do not treat the presence of a
file in the API as proof of reusable rights.

Pixabay may be evaluated through a separate, small candidate pilot. Its current
Content License is a custom license rather than a Creative Commons license, so
Pixabay records must not be labeled as CC content. Cache API responses for at
least 24 hours, issue only narrowly scoped human-directed searches, and never
perform systematic downloads. API image URLs may be used temporarily during
review; any selected image must be downloaded locally rather than permanently
hotlinked. Retain the image page, contributor, Pixabay identifier, license
snapshot, and review date, and check recognizable people, trademarks, property,
and misleading-context risks before publication.

## Fail-closed review requirements

An image may be published only when its reviewed manifest entry contains:

- the destination ID and reviewed Wikidata entity ID;
- the Commons file title and file-description-page URL;
- an image or thumbnail URL returned by the Commons API;
- creator or required attribution text;
- machine-readable license name and license URL;
- the date the destination match and rights metadata were reviewed;
- concise alternative text written for this destination context; and
- the source revision or metadata timestamp used for the review.

Reject or hold a candidate when:

- the Wikidata entity could refer to a similarly named but different place;
- the photograph depicts only an unverified subplace or temporary event;
- creator, license, or source metadata is missing;
- the file is non-free, nominated for deletion, or carries unresolved reuse
  restrictions;
- a license requires terms the product cannot satisfy; or
- the image's age or framing could materially misrepresent current conditions.

Initially allow public-domain, CC0, CC BY, and CC BY-SA files after individual
review. Preserve the exact license version and any share-alike obligation in
the manifest rather than reducing these to a generic “Wikimedia” label.

## Presentation and accessibility

- Treat images as optional enhancement; destinations without a reviewed image
  retain the same information and actions.
- Reserve image dimensions to prevent layout movement.
- Use contextual alternative text that describes useful visible content; do
  not repeat the destination name as the entire description.
- Keep creator and license credit visible beside the image or in an immediately
  adjacent disclosure, with links to the file page and license.
- Do not put essential amenity, hours, route, or accessibility information only
  in an image or its alternative text.
- When multiple reviewed images are available, use a manual slideshow with no
  autoplay, clear previous and next controls, a programmatically announced
  position, and image-specific captions and credits.
- Prefer an image that shows the destination's grounds, paths, landscape, or
  visitor experience over a nearby landmark or a view visible from the site.
- When two or more good images are available, do not use a panorama as the
  first slide. Lead with an image whose aspect ratio and subject fit the content
  area; retain a useful panorama only as a later slide.
- Keep the initial gallery small and purposeful rather than presenting every
  discovered file.

## Implementation sequence

1. Create an empty, validated media manifest and fail-closed validator.
2. Build a narrowly scoped Wikidata candidate-discovery report without
   publishing candidates.
   Run LocalWiki discovery separately so its attribution and exception checks
   remain visible during review.
3. Manually review a small, representative destination sample.
4. Add one responsive destination gallery with image-specific attribution.
5. Validate mobile layout, alternative text, missing-image behavior, licensing
   display, and metadata refresh behavior before expanding coverage.

## Primary references

- Wikimedia Commons, “Reusing content outside Wikimedia”:
  <https://commons.wikimedia.org/wiki/Commons:REUSE>
- MediaWiki CommonsMetadata API fields:
  <https://www.mediawiki.org/wiki/Extension:CommonsMetadata/en>
- Wikidata data-access guidance:
  <https://www.wikidata.org/wiki/Help:Data_access>
