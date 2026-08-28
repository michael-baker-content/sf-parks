import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackToResults } from "../../../components/BackToResults";
import { DestinationMatch } from "../../../components/DestinationMatch";
import { DestinationMap } from "../../../components/DestinationMap";
import { DestinationGallery } from "../../../components/DestinationGallery";
import { OfficialServicePathways } from "../../../components/OfficialServicePathways";
import { NearbyDestinations } from "../../../components/NearbyDestinations";
import { NearbyTransit } from "../../../components/NearbyTransit";
import { nearbyDestinations } from "../../../src/lib/nearby-destinations.js";
import { nearbyTransit } from "../../../src/lib/nearby-transit.js";
import destinationsDocument from "../../../data/presentation/generated/destinations.json";
import mediaManifest from "../../../data/media/media-manifest.json";
import evergreenContent from "../../../data/content/evergreen-content.json";
import content from "../../../data/presentation/ui-content.json";
import sourceRegistry from "../../../data/sources.json";
import normalizationReport from "../../../data/normalized/normalization-report.json";
import transitDocument from "../../../data/normalized/transit.json";

type Destination = (typeof destinationsDocument.records)[number];
type Amenity = { label: string; category: string; quantity: number | null; quantityStatus: string };
type EvergreenRecord = {
  destinationId: string;
  overview?: { text: string; sourceRefs: string[] };
  history?: { text: string; sourceRefs: string[] };
  highlights?: { label: string; description: string; category: string; sourceRefs: string[] }[];
  physicalFacts?: { label: string; value: string; category: string; sourceRefs: string[] }[];
  sources: { id: string; title: string; url: string; retrievedAt: string }[];
  review: { status: string; reviewedAt: string; reviewedBy: string; notes: string };
};
const destinations = new Map(destinationsDocument.records.map((item) => [item.id, item]));
const evergreenByDestination = new Map((evergreenContent.records as EvergreenRecord[]).map((item) => [item.destinationId, item]));
export const dynamicParams = false;
export function generateStaticParams() { return destinationsDocument.records.map(({ id }) => ({ id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const destination = destinations.get((await params).id); return { title: destination?.publicName ?? "Destination not found" };
}
function quantityText(amenity: Amenity) {
  if (amenity.quantityStatus !== "official-page-verified") return amenity.label;
  return `${amenity.quantity} ${(amenity.quantity === 1 ? amenity.label : `${amenity.label}s`).toLowerCase()}`;
}
function readableDate(value: string) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value.includes("T") ? value : `${value}T00:00:00`)); }

export default async function DestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const destination = destinations.get((await params).id); if (!destination) notFound();
  const order = new Map(content.amenityGroups.map((group) => [group.id, group]));
  const grouped = destination.amenities.reduce<Record<string, Amenity[]>>((groups, item) => { (groups[item.category] ??= []).push(item); return groups; }, {});
  const groups = Object.entries(grouped).sort(([a], [b]) => (order.get(a)?.order ?? 999) - (order.get(b)?.order ?? 999));
  const showSubplaces = destination.kind !== "virtual-property" && destination.subplaces.length > 1;
  const coverage = content.coverage[destination.coverage as keyof typeof content.coverage];
  const sourceIds = new Set(["datasf-rec-park-properties", ...destination.amenities.flatMap((amenity) => amenity.evidence.flatMap((item) => item.sourceReferences.map((reference) => reference.sourceId)))]);
  const retrievedAt = new Map(normalizationReport.inputs.sources.map((item) => [item.sourceId, item.retrievedAt]));
  const citySources = sourceRegistry.sources.filter((source) => sourceIds.has(source.id));
  const technicalIds = new Set<string>([...(destination.propertyIds as string[]), ...(destination.principalFacilityIds as string[])]);
  const sourceAliases = destination.searchableAliases.filter((alias) => alias !== destination.publicName && !technicalIds.has(alias));
  const images = mediaManifest.images.filter((image) => image.destinationId === destination.id).sort((a, b) => a.position - b.position);
  const evergreen = evergreenByDestination.get(destination.id);
  const nearby = nearbyDestinations(destinationsDocument.records, destination.id);
  const transit = nearbyTransit(transitDocument, destination.displayPoint);
  const pageLinks = [
    evergreen ? { id: "about", label: "About" } : null,
    destination.displayPoint ? { id: "location", label: "Location" } : null,
    { id: "amenities", label: "Amenities" },
    showSubplaces ? { id: "places", label: "Places here" } : null,
    transit.length ? { id: "transit", label: "Transit" } : null,
    { id: "services", label: "Programs and reservations" },
    { id: "official", label: "Official information" },
    nearby.length ? { id: "nearby", label: "Nearby places" } : null
  ].filter((item): item is { id: string; label: string } => Boolean(item));
  return <div className="app-destination-shell"><Suspense fallback={<LinkFallback />}><BackToResults /></Suspense><article className="app-destination">
    <header><p className="app-eyebrow">{destination.placeTypes.join(" · ")}</p><h1>{destination.publicName}</h1><p className="app-location">{[destination.neighborhood, destination.address].filter(Boolean).join(" · ")}</p></header>
    <Suspense><DestinationMatch destinationId={destination.id} /></Suspense>
    <nav className="app-page-nav" aria-label="On this page">
      <div className="app-page-nav__desktop"><strong>On this page</strong><ul>{pageLinks.map((link) => <li key={link.id}><a href={`#${link.id}`}>{link.label}</a></li>)}</ul></div>
      <details className="app-page-nav__mobile"><summary><span aria-hidden="true">☰</span> On this page</summary><ul>{pageLinks.map((link) => <li key={link.id}><a href={`#${link.id}`}>{link.label}</a></li>)}</ul></details>
    </nav>
    <DestinationGallery name={destination.publicName} images={images} />
    {evergreen && <section className="app-evergreen" id="about" aria-labelledby="about-title">
      <h2 id="about-title">About this place</h2>
      {evergreen.overview && <p className="app-evergreen__overview">{evergreen.overview.text}</p>}
      {evergreen.physicalFacts?.length ? <dl className="app-evergreen__facts">{evergreen.physicalFacts.map((fact) => <div key={`${fact.category}-${fact.label}`}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl> : null}
      {evergreen.highlights?.length ? <><h3>Highlights</h3><ul className="app-evergreen__highlights">{evergreen.highlights.map((highlight) => <li key={`${highlight.category}-${highlight.label}`}><strong>{highlight.label}</strong><span>{highlight.description}</span></li>)}</ul></> : null}
      {evergreen.history && <><h3>History</h3><p>{evergreen.history.text}</p></>}
      <p className="usa-hint app-evergreen__sources">Context from {evergreen.sources.map((source, index) => <span key={source.id}>{index > 0 && ", "}<a href={source.url} rel="external">{source.title} <span aria-hidden="true">↗</span></a></span>)} · Reviewed <time dateTime={evergreen.review.reviewedAt}>{readableDate(evergreen.review.reviewedAt)}</time></p>
    </section>}
    {destination.displayPoint && <DestinationMap name={destination.publicName} latitude={destination.displayPoint.latitude} longitude={destination.displayPoint.longitude} apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY} />}
    <section id="amenities" aria-labelledby="amenities-title"><h2 id="amenities-title">What is listed here</h2><p className="usa-hint">{content.quantityNotice}</p><div className="app-amenity-groups">{groups.map(([id, items]) => <section key={id}><h3>{order.get(id)?.label ?? id}</h3><ul>{items.map((item) => <li key={`${item.category}-${item.label}`}>{quantityText(item)}</li>)}</ul></section>)}</div></section>
    {showSubplaces && <section id="places" aria-labelledby="subplaces-title"><h2 id="subplaces-title">Places within this destination</h2><ul>{destination.subplaces.map((item) => <li key={`${item.type}-${item.id}`}><strong>{item.label}</strong> <span className="app-muted">({item.type})</span></li>)}</ul></section>}
    <NearbyTransit groups={transit} retrievedAt={transitDocument.source.retrievedAt} />
    <OfficialServicePathways amenities={destination.amenities} />
    <section className="app-official-actions" id="official" aria-labelledby="official-title">
      <h2 id="official-title">Official information and coverage</h2>
      {destination.officialActions.length ? <><ul>{destination.officialActions.map((action) => { const definition = content.officialActions[action.type as keyof typeof content.officialActions]; return <li key={`${action.type}-${action.url}`}><a href={action.url} rel="external">{definition.label} <span aria-hidden="true">↗</span></a><p>Official SF Recreation and Parks website · Reviewed <time dateTime={action.reviewedAt}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(`${action.reviewedAt}T00:00:00`))}</time></p></li>; })}</ul><p className="usa-hint">{content.handoffNotice}</p></> : <p>{content.emptyOfficialActions}</p>}
      <div className="app-coverage-summary" aria-labelledby="coverage-detail-title"><h3 id="coverage-detail-title">About this page’s coverage</h3><p><strong>{coverage.shortLabel}</strong></p><p>{coverage.description}</p><p>{coverage.missingInformation}</p></div>
    </section>
    <NearbyDestinations destinations={nearby} />
    <details className="app-source-details"><summary>Source details</summary><div>
      <p>This destination combines records published by the City of San Francisco into resident-facing information. Technical identifiers are included for verification.</p>
      <h2>Contributing San Francisco records</h2><ul>{destination.subplaces.map((item) => <li key={`${item.type}-${item.id}`}><strong>{item.label}</strong> — {item.type} ID {item.id}</li>)}</ul>
      {sourceAliases.length > 0 && <><h2>Other source names</h2><ul>{sourceAliases.map((alias) => <li key={alias}>{alias}</li>)}</ul></>}
      <h2>Amenity evidence</h2><ul>{destination.amenities.map((amenity) => <li key={`${amenity.category}-${amenity.label}`}><strong>{amenity.label}</strong> — {content.quantity[amenity.quantityStatus as keyof typeof content.quantity]}</li>)}</ul>
      <h2>DataSF datasets</h2><ul className="app-source-list">{citySources.map((source) => <li key={source.id}><a href={source.sourceUrl} rel="external">{source.name} <span aria-hidden="true">↗</span></a><p>{source.attributionLabel} · Retrieved <time dateTime={retrievedAt.get(source.id)}>{readableDate(retrievedAt.get(source.id)!)}</time> · <a href={source.license.url}>License: {source.license.id}</a></p></li>)}</ul>
      {destination.officialActions.length > 0 && <><h2>Reviewed official pages</h2><ul>{destination.officialActions.map((action) => <li key={action.url}><a href={action.url} rel="external">{content.officialActions[action.type as keyof typeof content.officialActions].label} <span aria-hidden="true">↗</span></a> — reviewed <time dateTime={action.reviewedAt}>{readableDate(action.reviewedAt)}</time></li>)}</ul></>}
      {destination.presentationReview && <><h2>Presentation decision</h2><p>{destination.presentationReview.reason}</p></>}
    </div></details>
  </article></div>;
}
function LinkFallback() { return <a className="usa-back-link" href="/explore/">Back to results</a>; }
