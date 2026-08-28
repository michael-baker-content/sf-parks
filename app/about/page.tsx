import content from "../../data/presentation/ui-content.json";

export const metadata = { title: "About the data" };

export default function AboutPage() {
  return <article className="app-prose">
    <h1>About the data</h1>
    <p>SF Parks Explorer is an independent prototype that reorganizes information published by the City of San Francisco around resident tasks.</p>
    <h2>What the data can tell us</h2>
    <p>The explorer uses official open data describing park properties, facilities, functional areas, and maintained assets.</p>
    <h2>What it cannot guarantee</h2><p>{content.coverage["open-data-only"].missingInformation}</p>
    <h2>Independent project</h2><p>{content.independenceNotice}</p>
  </article>;
}
