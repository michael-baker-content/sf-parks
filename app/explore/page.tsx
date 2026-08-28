import { Suspense } from "react";
import { Explorer } from "../../components/Explorer";

export const metadata = { title: "Explore" };

export default function ExplorePage() {
  const mapStyleUrl = "https://tiles.openfreemap.org/styles/positron";
  return <Suspense fallback={<p>Loading park information…</p>}><Explorer mapStyleUrl={mapStyleUrl} /></Suspense>;
}
