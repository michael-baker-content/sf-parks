"use client";

import { useState } from "react";
import { googleMapsDirectionsUrl, googleMapsEmbedUrl, googleMapsSearchUrl } from "../src/lib/maps.js";

export function DestinationMap({ name, latitude, longitude, apiKey }: { name: string; latitude: number; longitude: number; apiKey?: string }) {
  const [visible, setVisible] = useState(false);
  return <section className="app-location-map" id="location" aria-labelledby="location-map-title">
    <h2 id="location-map-title">Location</h2>
    <div className="app-location-actions">
      <a href={googleMapsSearchUrl(latitude, longitude)} rel="external">Open in Google Maps <span aria-hidden="true">↗</span></a>
      <a href={googleMapsDirectionsUrl(latitude, longitude)} rel="external">Get directions <span aria-hidden="true">↗</span></a>
      {apiKey && !visible && <button className="usa-button usa-button--outline" type="button" onClick={() => setVisible(true)}>Show map</button>}
    </div>
    {apiKey && visible && <div className="app-map-frame"><iframe allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={googleMapsEmbedUrl(apiKey, latitude, longitude)} title={`Google map showing ${name}`} /></div>}
  </section>;
}
