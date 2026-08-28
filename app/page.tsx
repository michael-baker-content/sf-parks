import Link from "next/link";
import { SearchForm } from "../components/SearchForm";
import configuration from "../data/search/search-filters.json";
import destinationsDocument from "../data/presentation/generated/destinations.json";
import evergreenContent from "../data/content/evergreen-content.json";
import mediaManifest from "../data/media/media-manifest.json";

const featuredIds = ["golden-gate-park", "mission-dolores-park", "sigmund-stern-recreation-grove", "lafayette-park"];
const featuredParks = featuredIds.map((id) => ({
  destination: destinationsDocument.records.find((item) => item.id === id)!,
  context: evergreenContent.records.find((item) => item.destinationId === id)!,
  image: mediaManifest.images.find((item) => item.destinationId === id)!,
}));

export default function HomePage() {
  return <>
    <section className="app-hero app-hero--image" aria-labelledby="home-title">
      <p className="app-eyebrow">Independent public-data prototype</p>
      <h1 id="home-title">Find a park that fits your plans</h1>
      <p className="app-lede">Explore San Francisco parks, playgrounds, recreation centers, and listed amenities.</p>
      <SearchForm label="Find a park or recreation destination" />
    </section>
    <section id="activities" aria-labelledby="activities-title">
      <h2 id="activities-title">What would you like to do?</h2>
      <div className="app-activity-grid">{configuration.activities.map((activity) =>
        <Link className="app-activity-card" key={activity.id} href={`/explore/?activity=${encodeURIComponent(activity.id)}`}>
          <span className="app-activity-icon" aria-hidden="true">{activity.icon}</span>
          <span>{activity.label}</span>
        </Link>
      )}</div>
    </section>
    <section className="app-service-entry" aria-labelledby="service-entry-title">
      <div><p className="app-eyebrow">Get involved</p><h2 id="service-entry-title">Find your next experience</h2><p>Join a program, reserve a space, or find the right permit for your plans.</p></div>
      <div className="app-service-entry__actions">
        <Link className="usa-button" href="/programs-and-reservations/#programs">Find a program</Link>
        <Link className="usa-button usa-button--outline" href="/programs-and-reservations/#reservations">Permits and reservations</Link>
      </div>
    </section>
    <section className="app-featured" aria-labelledby="featured-title">
      <div className="app-section-heading">
        <div><p className="app-eyebrow">Good places to start</p><h2 id="featured-title">Featured parks</h2></div>
        <p>Explore destinations with photographs, detailed amenity listings, and additional reviewed context.</p>
      </div>
      <div className="app-featured-grid">{featuredParks.map(({ destination, context, image }) =>
        <article className="app-featured-card" key={destination.id}>
          <div className="app-featured-card__image"><img src={image.localPath} width={image.width} height={image.height} alt={image.alt} /></div>
          <div className="app-featured-card__body">
            <h3><Link href={`/parks/${destination.id}/`}>{destination.publicName}</Link></h3>
            <p className="app-location">{destination.neighborhood}</p>
            <p>{context.overview.text}</p>
            <p className="app-featured-card__meta">{destination.amenities.length} listed amenities</p>
          </div>
          <p className="app-featured-card__credit"><a href={image.filePageUrl} rel="external">{image.attribution} <span aria-hidden="true">↗</span></a> · <a href={image.licenseUrl} rel="license">{image.licenseId}</a></p>
        </article>
      )}</div>
    </section>
    <section className="usa-alert usa-alert--info app-info" aria-labelledby="coverage-title"><div className="usa-alert__body">
      <h2 className="usa-alert__heading" id="coverage-title">About the information</h2>
      <p className="usa-alert__text">Results use open data published by the City of San Francisco. Features not shown may still be available, and only a small number of official facility pages have been reviewed so far.</p>
    </div></section>
  </>;
}
