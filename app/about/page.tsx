import content from "../../data/presentation/ui-content.json";

export const metadata = { title: "About the data" };

export default function AboutPage() {
  return <article className="app-about">
    <header className="app-about__header">
      <p className="app-eyebrow">About this project</p>
      <h1>About the data</h1>
      <p className="app-about__lede">SF Parks Explorer is an independent prototype that reorganizes information published by the City of San Francisco around resident tasks.</p>
    </header>

    <figure className="app-about__visual">
      <img
        src="/media/park-image-placeholder.png"
        alt="Illustration of a landscaped hillside park with a curving path, trees, benches, and bay water under coastal fog."
      />
      <figcaption>Placeholder illustration representing San Francisco parkland.</figcaption>
    </figure>

    <div className="app-about__grid">
      <section className="app-about__panel app-about__panel--scope">
        <p className="app-about__panel-label" aria-hidden="true">What is included</p>
        <h2>What the data can tell us</h2>
        <p>The explorer uses official open data describing park properties, facilities, functional areas, and maintained assets.</p>
      </section>

      <section className="app-about__panel app-about__panel--limits">
        <p className="app-about__panel-label" aria-hidden="true">Keep in mind</p>
        <h2>What it cannot guarantee</h2>
        <p>{content.coverage["open-data-only"].missingInformation}</p>
      </section>

      <section className="app-about__panel app-about__panel--independent">
        <p className="app-about__panel-label" aria-hidden="true">Our relationship</p>
        <h2>Independent project</h2>
        <p>{content.independenceNotice}</p>
      </section>
    </div>
  </article>;
}
