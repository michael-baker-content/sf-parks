# Finding the Park, Not the System: Building a Better Way to Explore San Francisco Parks

*A first-person project reflection on turning fragmented public information into a resident-centered discovery experience.*

San Francisco has an extraordinary collection of parks, playgrounds,
recreation centers, trails, gardens, athletic facilities, and public programs.
Finding the right place for an ordinary plan, however, can require much more
work than it should.

This project began after I read Emma Silvers’s Coyote Media article about the
San Francisco Recreation and Parks website. The article described residents
struggling to find schedules, understand reservation pathways, and navigate
between websites and vendor systems. It framed the problem as more than dated
visual design. The public experience was inheriting the boundaries of
departments, databases, and service providers.

I wanted to explore a focused question: could I build a small discovery layer
that helps someone find an appropriate park or recreation destination without
trying to replace the official systems behind it?

## Defining a responsible boundary

The most important early decision was what not to build.

I did not want to recreate registration, reservations, payments, permits, or
program inventory. Those services involve changing availability, eligibility
rules, personal information, and transactions. An independent prototype would
be a poor authority for them.

Instead, I focused on discovery and comprehension. The site should help a
resident answer questions such as:

- Where can I play tennis, find a playground, or visit a garden?
- What is listed at a particular park?
- What other destinations are nearby?
- How could I reach the destination by Muni, BART, or Caltrain?
- Where should I go next for an official program, reservation, or permit?

The prototype organizes those answers and then makes an explicit handoff to the
official source when information becomes transactional or time-sensitive.

I also decided that the public experience should not depend on generative AI.
AI can be useful during research and development, but residents should not
consume tokens every time they search for a basketball court. The product uses
conventional text search, synonyms, transparent filters, and deterministic
ranking. The same query produces the same result, and the site can explain why
a destination matched.

## Turning records into places

The City of San Francisco publishes useful Recreation and Parks datasets
through DataSF. That provided a strong foundation, but open data is not the
same thing as a finished public experience.

The source records reflect operational needs. Properties, facilities,
functional areas, and assets can overlap. Names vary. A familiar park may be
split across multiple records, while an internal section name may be useful for
search but confusing as a top-level destination. Quantities are not always
expressed consistently enough to present as verified counts.

I built a normalization process that preserves the source records and their
provenance while creating resident-facing destinations. Ambiguous relationships
fail closed instead of being guessed. Familiar names remain visible, internal
aliases remain searchable, and the interface distinguishes between a listed
feature and a verified quantity.

That work now supports 249 statically generated destination pages. Each page can
combine amenities, reviewed descriptive context, maps, nearby destinations,
transit guidance, and links to official next actions.

## Adding useful context without creating a maintenance trap

Open data described many physical features, but it did not provide the durable
context people often want when deciding whether to visit a place. I developed a
separate evergreen-content workflow for official facility pages.

The rule was intentionally strict: retain durable history, landscape,
permanent highlights, and physical setting; exclude closures, schedules, fees,
program announcements, and other operational details. Every published
statement must point to a reviewed source.

The workflow produced reviewed evergreen content for 133 destinations. It also
created a visible deferred queue for pages that contained no useful descriptive
material, only temporary notices, or mismatched copy. One official page, for
example, appeared to serve text for a different mini park. Deferring it was
more valuable than confidently publishing the wrong information.

Transit required a similar boundary. Using the 511 SF Bay regional feed, the
site now prepares 3,314 Muni, BART, and Caltrain stops and stations across 85
routes. A visitor can select how they are traveling. Muni users see nearby
stops; BART and Caltrain users can see the nearest station and possible Muni
lines serving both the station area and the destination area.

These are not presented as live directions. The site links to the transit
agency for current arrivals, transfers, disruptions, and accessibility
information. That makes the feature useful without pretending that scheduled
data is real-time guidance.

## What has worked well

Several decisions have held up as the prototype expanded:

**One search system.** Search is available from the homepage, the Explore page,
and a compact header control on every page. Every entry point uses the same URL
state, matching logic, filters, and result explanations.

**Progressive handoffs.** Programs and reservations are not duplicated. The
site suggests relevant official pathways and clearly labels when a resident is
leaving the explorer.

**Provenance before polish.** Source permissions, retrieval dates, review
status, attribution, and content limitations are encoded rather than left as
informal project knowledge.

**Static delivery.** The public site does not need a running application server
or visitor-facing data token. Source imports and normalization happen ahead of
time, producing a fast static site.

**Accessibility as a working constraint.** Keyboard focus, semantic headings,
form labels, mobile disclosures, reduced-motion behavior, non-map browsing, and
a 320-pixel support floor have influenced the component design from the start.

The current automated suite contains 74 passing tests, and all 249 destination
pages complete a production build. Focused browser checks cover mobile search,
anchor navigation, transit selection, minimum-width behavior, and ultra-wide
centering.

## The roadblocks were mostly about judgment

The hardest problems were rarely about drawing the interface.

Data ambiguity required decisions about when two records represented the same
public place. Official webpages varied from rich historical descriptions to
empty templates and temporary construction notices. Feature labels required
consolidation without erasing useful distinctions. Transit data could identify
possible connections but not responsibly promise a live journey.

Images became their own research problem. The open-data licenses did not grant
rights to photographs appearing elsewhere. Wikimedia and LocalWiki produced a
small number of useful candidates, but rate limits, incomplete licensing
details, panoramas, and images focused on the wrong landmark made broad
automation inappropriate. Stock-photo searches were generally too generic to
help someone recognize a specific park. For now, most destinations use a
clearly labeled illustration while I plan to add stronger location-specific
photography later.

Even small interface changes exposed tradeoffs. A global search panel initially
overflowed the narrowest supported viewport because inherited width rules
interacted badly. Long destination pages needed anchor navigation, but the
mobile header could not become another wall of links. Visual section colors
needed to differ in structure—not merely be several technically different pale
tints.

Those iterations reinforced a central lesson: accessibility and clarity are
not a final review step. They shape the information model and the smallest CSS
decision alike.

## What remains

This is a substantial prototype, not a demonstrated service improvement.

The next content task is researching authoritative alternate sources for
high-value destinations whose official pages lack durable information. Better
location-specific photography remains a separate track. The project also needs
a formal accessibility audit and task-based usability sessions.

Those sessions will be the point at which I can ask whether the approach
actually helps residents find a suitable destination, understand the limits of
the information, and reach the right official next step. Until then, the
numbers in this project describe coverage and technical reliability—not faster
task completion or greater public access.

That distinction matters. The goal was never to put a friendlier coat of paint
on a directory. It was to explore how a public-information experience could be
organized around the person looking for a park rather than the system storing
the record.
