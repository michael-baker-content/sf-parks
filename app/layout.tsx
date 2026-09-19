import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces } from "next/font/google";
import { HeaderControls } from "../components/HeaderControls";
import "@uswds/uswds/css/uswds.css";
import "./styles.css";

const brandFont = Fraunces({ subsets: ["latin"], weight: "700", display: "swap", variable: "--app-brand-font" });

export const metadata: Metadata = {
  title: { default: "SF Parks Explorer", template: "%s · SF Parks Explorer" },
  description: "Explore San Francisco parks and recreation destinations using open data published by the City of San Francisco.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={brandFont.variable}><body>
    <a className="usa-skipnav" href="#main-content">Skip to main content</a>
    <header className="app-header">
      <div className="grid-container app-header__inner">
        <Link className="app-brand" href="/">
          <svg className="app-brand__leaf" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 3C11 2 4 6 4 13a7 7 0 0 0 7 7c7 0 10-8 9-17Z" fill="currentColor" /><path d="M3 22 16 9M8 17l-1-5m6 0 4 1" fill="none" stroke="var(--app-green-light)" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span>SF Parks Explorer</span>
        </Link>
        <HeaderControls />
      </div>
    </header>
    <main id="main-content" className="grid-container app-main" tabIndex={-1}>{children}</main>
    <footer className="app-footer"><div className="grid-container">
      <p>Uses public data published by the City and County of San Francisco through DataSF. This independent application is not affiliated with or endorsed by the City. Verify important details with the linked official source.</p>
    </div></footer>
  </body></html>;
}
