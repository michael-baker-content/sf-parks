import { Suspense } from "react";
import { Explorer } from "../../components/Explorer";

export const metadata = { title: "Explore" };

export default function ExplorePage() {
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/positron";
  return <Suspense fallback={<p>Loading park information…</p>}><Explorer mapStyleUrl={mapStyleUrl} /></Suspense>;
}
