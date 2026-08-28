"use client";

import { useEffect, useRef, useState } from "react";

type MapDestination = { id: string; name: string; latitude: number; longitude: number; href: string };

export function ResultsMap({ destinations, styleUrl }: { destinations: MapDestination[]; styleUrl: string }) {
  const container = useRef<HTMLDivElement>(null); const [error, setError] = useState(false);
  useEffect(() => {
    if (!container.current || !destinations.length) return;
    let disposed = false; let removeMap: (() => void) | undefined;
    (async () => { try {
      const maplibre = await import("maplibre-gl"); if (disposed || !container.current) return;
      maplibre.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      const map = new maplibre.Map({ container: container.current, style: styleUrl, center: [-122.44, 37.76], zoom: 11, cooperativeGestures: true });
      removeMap = () => map.remove(); map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        map.getCanvas().setAttribute("aria-label", "Map of filtered park destinations");
        const data = { type: "FeatureCollection" as const, features: destinations.map((item) => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [item.longitude, item.latitude] }, properties: { name: item.name, href: item.href } })) };
        map.addSource("destinations", { type: "geojson", data });
        map.addLayer({ id: "destination-points", type: "circle", source: "destinations", paint: { "circle-radius": 7, "circle-color": "#1b5e3b", "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } });
        const hoverPopup = new maplibre.Popup({ closeButton: false, closeOnClick: false, offset: 10 });
        map.on("mouseenter", "destination-points", (event) => {
          map.getCanvas().style.cursor = "pointer";
          const feature = event.features?.[0];
          if (!feature || feature.geometry.type !== "Point") return;
          const label = document.createElement("strong");
          label.textContent = String(feature.properties?.name ?? "Park destination");
          hoverPopup
            .setLngLat(feature.geometry.coordinates as [number, number])
            .setDOMContent(label)
            .addTo(map);
        });
        map.on("mouseleave", "destination-points", () => {
          map.getCanvas().style.cursor = "";
          hoverPopup.remove();
        });
        map.on("click", "destination-points", (event) => {
          const feature = event.features?.[0]; if (!feature) return;
          hoverPopup.remove();
          const wrapper = document.createElement("div"); const name = document.createElement("strong"); name.textContent = String(feature.properties?.name ?? "Park destination");
          const link = document.createElement("a"); link.href = String(feature.properties?.href ?? "/explore/"); link.textContent = "View destination";
          wrapper.append(name, document.createElement("br"), link); new maplibre.Popup().setLngLat(event.lngLat).setDOMContent(wrapper).addTo(map);
        });
        if (destinations.length === 1) map.setCenter([destinations[0].longitude, destinations[0].latitude]).setZoom(14);
        else { const bounds = new maplibre.LngLatBounds(); for (const item of destinations) bounds.extend([item.longitude, item.latitude]); map.fitBounds(bounds, { padding: 36, maxZoom: 14, duration: 0 }); }
      });
      map.on("error", () => setError(true));
    } catch { setError(true); } })();
    return () => { disposed = true; removeMap?.(); };
  }, [destinations, styleUrl]);
  if (error) return <div className="usa-alert usa-alert--error" role="alert"><div className="usa-alert__body"><p className="usa-alert__text">The map could not be loaded. All destinations remain available in the list below.</p></div></div>;
  return <div className="app-results-map" ref={container} role="region" aria-label="Filtered destinations map" />;
}
