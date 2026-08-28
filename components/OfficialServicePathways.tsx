import Link from "next/link";
import handoffs from "../data/content/official-service-handoffs.json";

type Amenity = { label: string; category: string };
type Handoff = (typeof handoffs.programs)[number] | (typeof handoffs.reservations)[number];

const allHandoffs = [...handoffs.programs, ...handoffs.reservations] as Handoff[];
const byId = new Map(allHandoffs.map((handoff) => [handoff.id, handoff]));

function suggestedHandoffs(amenities: Amenity[]) {
  const labels = new Set(amenities.map((amenity) => amenity.label));
  const categories = new Set(amenities.map((amenity) => amenity.category));
  const ids: string[] = [];
  if (labels.has("Picnic Area")) ids.push("picnic-rentals");
  if (["Tennis Court", "Pickleball Court", "Tennis/Pickleball Court"].some((label) => labels.has(label))) ids.push("tennis-pickleball");
  else if (["Ball Field", "Baseball Field", "Softball Field", "Soccer Field", "Multi-Use Turf"].some((label) => labels.has(label))) ids.push("athletic-fields");
  if (categories.has("swimming")) ids.push("aquatics");
  else if (categories.has("recreation-centers")) ids.push("recreation-programs");
  return ids.slice(0, 3).map((id) => byId.get(id)).filter((handoff): handoff is Handoff => Boolean(handoff));
}

export function OfficialServicePathways({ amenities }: { amenities: Amenity[] }) {
  const suggestions = suggestedHandoffs(amenities);
  return <section className="app-service-pathways" id="services" aria-labelledby="service-pathways-title">
    <p className="app-eyebrow">Official services</p>
    <h2 id="service-pathways-title">Programs and reservations</h2>
    {suggestions.length > 0 ? <>
      <p>These official pathways may be relevant based on amenities listed at this destination. Availability, eligibility, and reservability have not been verified here.</p>
      <ul>{suggestions.map((handoff) => <li key={handoff.id}>
        <a href={handoff.url} rel="external">{handoff.label}<span className="usa-sr-only"> — official San Francisco Recreation and Parks website</span> <span aria-hidden="true">↗</span></a>
        <p>{handoff.description}</p>
      </li>)}</ul>
    </> : <p>Looking for a class, permit, or reservation? Use our guide to find the appropriate official San Francisco Recreation and Parks service.</p>}
    <Link className="usa-button usa-button--outline" href="/programs-and-reservations/">View the programs and reservations guide</Link>
  </section>;
}
