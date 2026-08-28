import Link from "next/link";

type NearbyDestination = {
  destination: {
    id: string;
    publicName: string;
    neighborhood: string | null;
    placeTypes: string[];
  };
  distanceMiles: number;
};

function distanceLabel(distance: number) {
  if (distance < 0.1) return "Less than 0.1 mile away";
  const rounded = distance.toFixed(1);
  return `${rounded} ${rounded === "1.0" ? "mile" : "miles"} away`;
}

export function NearbyDestinations({ destinations }: { destinations: NearbyDestination[] }) {
  if (!destinations.length) return null;
  return <section className="app-nearby" id="nearby" aria-labelledby="nearby-title">
    <h2 id="nearby-title">Explore nearby</h2>
    <p className="usa-hint">Distances are approximate straight-line measurements. Streets, hills, paths, and entrances may affect your route.</p>
    <div className="app-nearby-grid">{destinations.map(({ destination, distanceMiles }) => <article key={destination.id}>
      <h3><Link href={`/parks/${destination.id}/`}>{destination.publicName}</Link></h3>
      <p className="app-location">{[destination.neighborhood, destination.placeTypes[0]].filter(Boolean).join(" · ")}</p>
      <p className="app-nearby__distance">{distanceLabel(distanceMiles)}</p>
    </article>)}</div>
  </section>;
}
