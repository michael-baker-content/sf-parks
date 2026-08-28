import type { Metadata } from "next";
import Link from "next/link";
import { GlobalSearch } from "../components/GlobalSearch";
import "@uswds/uswds/css/uswds.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";

export const metadata: Metadata = {
  title: { default: "SF Parks Explorer", template: "%s · SF Parks Explorer" },
  description: "Explore San Francisco parks and recreation destinations using open data published by the City of San Francisco.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <a className="usa-skipnav" href="#main-content">Skip to main content</a>
    <header className="app-header">
      <div className="grid-container app-header__inner">
        <Link className="app-brand" href="/">SF Parks Explorer</Link>
        <nav aria-label="Primary"><ul className="app-nav">
          <li><Link href="/explore/">Explore</Link></li>
          <li><Link href="/programs-and-reservations/">Programs &amp; reservations</Link></li>
          <li><Link href="/#activities">Activities</Link></li>
          <li><Link href="/about/">About the data</Link></li>
          <li><GlobalSearch /></li>
        </ul></nav>
      </div>
    </header>
    <main id="main-content" className="grid-container app-main" tabIndex={-1}>{children}</main>
    <footer className="app-footer"><div className="grid-container">
      <p>Uses public data published by the City and County of San Francisco through DataSF. This independent application is not affiliated with or endorsed by the City. Verify important details with the linked official source.</p>
    </div></footer>
  </body></html>;
}
