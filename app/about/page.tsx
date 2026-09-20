import content from "../../data/presentation/ui-content.json";
import { resolveMediaAsset } from "../../src/lib/media-delivery.js";

export const metadata = { title: "About the data" };

export default function AboutPage() {
  const placeholder = resolveMediaAsset("/media/park-image-placeholder.png", 2048, 1536);
  return <article className="app-about">
    <header className="app-about__header">
      <p className="app-eyebrow">About this project</p>
      <h1>About the data</h1>
      <p className="app-about__lede">SF Parks Explorer is an independent prototype that reorganizes information published by the City of San Francisco around resident tasks.</p>
    </header>

    <figure className="app-about__visual">
      <img
        src={placeholder.src}
        srcSet={placeholder.srcSet}
        sizes="(max-width: 68rem) 100vw, 68rem"
        width={placeholder.width}
        height={placeholder.height}
        alt="Wide lawn at Fort Mason Park with trees, San Francisco Bay, and the Golden Gate Bridge in the distance."
      />
      <figcaption>Fort Mason Park lawn with the Golden Gate Bridge in the distance. Photo by Michael Baker.</figcaption>
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
