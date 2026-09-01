"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { selectFeaturedParks } from "../src/lib/featured-parks.js";

type FeaturedPark = {
  id: string;
  name: string;
  neighborhood: string | null;
  overview: string;
  amenityCount: number;
  image: {
    localPath: string;
    src: string;
    srcSet?: string;
    width: number;
    height: number;
    alt: string;
    filePageUrl: string;
    attribution: string;
    licenseUrl: string;
    licenseId: string;
  };
};

export function FeaturedParks({ parks }: { parks: FeaturedPark[] }) {
  const [selected, setSelected] = useState(() => parks.slice(0, 4));
  useEffect(() => setSelected(selectFeaturedParks(parks, 4)), [parks]);

  return <div className="app-featured-grid">{selected.map((park) => {
    return (
    <article className="app-featured-card" key={park.id}>
      <div className="app-featured-card__image"><img src={park.image.src} srcSet={park.image.srcSet} sizes="(max-width: 48rem) 100vw, 50vw" width={park.image.width} height={park.image.height} alt={park.image.alt} /></div>
      <div className="app-featured-card__body">
        <h3><Link href={`/parks/${park.id}/`}>{park.name}</Link></h3>
        <p className="app-location">{park.neighborhood}</p>
        <p>{park.overview}</p>
        <p className="app-featured-card__meta">{park.amenityCount} listed amenities</p>
      </div>
      <p className="app-featured-card__credit"><a href={park.image.filePageUrl} rel="external">{park.image.attribution} <span aria-hidden="true">↗</span></a> · <a href={park.image.licenseUrl} rel="license">{park.image.licenseId}</a></p>
    </article>
  );})}</div>;
}
