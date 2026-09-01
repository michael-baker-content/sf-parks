import type { Metadata } from "next";
import handoffs from "../../data/content/official-service-handoffs.json";
import { resolveMediaAsset } from "../../src/lib/media-delivery.js";

export const metadata: Metadata = {
  title: "Programs and reservations",
  description: "Find the appropriate official San Francisco Recreation and Parks program, permit, or reservation service.",
};

function HandoffList({ items }: { items: (typeof handoffs.programs | typeof handoffs.reservations) }) {
  return <div className="app-handoff-grid">{items.map((item) => <article className="app-handoff-card" key={item.id}>
    <h3><a href={item.url} rel="external">{item.label} <span aria-hidden="true">↗</span></a></h3>
    <p>{item.description}</p>
  </article>)}</div>;
}

export default function ProgramsAndReservationsPage() {
  const gardeningImage = resolveMediaAsset("/media/programs-youth-gardening-watercolor.jpg", 1696, 929);
  const pickleballImage = resolveMediaAsset("/media/programs-pickleball-watercolor.jpg", 1696, 929);
  return <article className="app-service-guide">
    <header>
      <p className="app-eyebrow">Guided official handoff</p>
      <h1>Find a program or reservation service</h1>
      <p className="app-lede">Choose what you are trying to do, then continue to the relevant official San Francisco Recreation and Parks page.</p>
    </header>
    <div className="usa-alert usa-alert--info app-service-guide__notice"><div className="usa-alert__body">
      <h2 className="usa-alert__heading">All destination links lead to the official website</h2>
      <p className="usa-alert__text">Every link below continues to the San Francisco Recreation and Parks website. This guide does not reproduce schedules, availability, fees, deadlines, eligibility, or registration; confirm those details there.</p>
    </div></div>
    <section id="programs" aria-labelledby="programs-title">
      <h2 id="programs-title">I want to join a program</h2>
      <figure className="app-service-guide__illustration">
        <img src={gardeningImage.src} srcSet={gardeningImage.srcSet} sizes="(max-width: 66rem) 100vw, 66rem" width={gardeningImage.width} height={gardeningImage.height} alt="Watercolor illustration of city youths learning to plant and water a public community garden with two adult program instructors." />
      </figure>
      <HandoffList items={handoffs.programs} />
    </section>
    <section id="reservations" aria-labelledby="reservations-title">
      <h2 id="reservations-title">I want to reserve a space or request a permit</h2>
      <figure className="app-service-guide__illustration">
        <img src={pickleballImage.src} srcSet={pickleballImage.srcSet} sizes="(max-width: 66rem) 100vw, 66rem" width={pickleballImage.width} height={pickleballImage.height} alt="Watercolor illustration of four mature adults enjoying a doubles pickleball game on a public park court." />
      </figure>
      <HandoffList items={handoffs.reservations} />
    </section>
    <p className="usa-hint app-service-guide__review">Official links reviewed <time dateTime={handoffs.reviewedAt}>August 27, 2026</time>.</p>
  </article>;
}
