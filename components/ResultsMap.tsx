"use client";

import { memo, useEffect, useRef, useState } from "react";
import { closestMapFeature, initialViewportDestinations, isMajorMapDestination, isUsableMapPoint } from "../src/lib/results-map.js";

type MapDestination = { id: string; name: string; latitude: number; longitude: number; href: string; amenityCount: number };

export const ResultsMap = memo(function ResultsMap({ destinations, styleUrl, preferCoreCity = false }: { destinations: MapDestination[]; styleUrl: string; preferCoreCity?: boolean }) {
  const container = useRef<HTMLDivElement>(null); const [error, setError] = useState(false); const [ready, setReady] = useState(false);
  const destinationsRef = useRef(destinations);
  destinationsRef.current = destinations;
  const destinationSignature = destinations.map((item) => `${item.id}:${item.latitude}:${item.longitude}:${item.amenityCount}`).sort().join("|");
  useEffect(() => {
    if (!container.current || !destinations.length) return;
    setReady(false);
    let disposed = false; let removeMap: (() => void) | undefined; let resizeObserver: ResizeObserver | undefined; let resizeFrame = 0;
    (async () => { try {
      const mappedDestinations = destinations.filter(isUsableMapPoint);
      const viewportDestinations = initialViewportDestinations(mappedDestinations, { preferCoreCity });
      if (!mappedDestinations.length || !viewportDestinations.length) { setError(true); return; }
      const maplibre = await import("maplibre-gl"); if (disposed || !container.current) return;
      maplibre.setWorkerUrl("/maplibre/maplibre-gl-worker.js");
      const map = new maplibre.Map({ container: container.current, style: styleUrl, center: [-122.44, 37.76], zoom: 11, cooperativeGestures: true });
      removeMap = () => map.remove(); map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          window.cancelAnimationFrame(resizeFrame);
          resizeFrame = window.requestAnimationFrame(() => map.resize());
        });
        resizeObserver.observe(container.current);
      }
      map.on("load", () => {
        map.getCanvas().setAttribute("aria-label", "Map of filtered park destinations");
        const data = { type: "FeatureCollection" as const, features: mappedDestinations.map((item) => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [item.longitude, item.latitude] }, properties: { id: item.id, name: item.name, major: isMajorMapDestination(item) } })) };
        map.addSource("destinations", { type: "geojson", data });
        map.addLayer({ id: "destination-points", type: "circle", source: "destinations", paint: { "circle-radius": ["case", ["==", ["get", "major"], true], 9, 6], "circle-color": "#1b5e3b", "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } });
        const hoverPopup = new maplibre.Popup({ closeButton: false, closeOnClick: false, offset: 10 });
        let hoveredDestination: string | null = null;
        map.on("mousemove", "destination-points", (event) => {
          map.getCanvas().style.cursor = "pointer";
          const feature = closestMapFeature(event.features, event.point, (coordinates: [number, number]) => map.project(coordinates));
          if (!feature || feature.geometry.type !== "Point") return;
          const destinationKey = String(feature.properties?.id ?? feature.properties?.name ?? "");
          if (destinationKey === hoveredDestination) return;
          hoveredDestination = destinationKey;
          const label = document.createElement("strong");
          label.textContent = String(feature.properties?.name ?? "Park destination");
          hoverPopup
            .setLngLat(feature.geometry.coordinates as [number, number])
            .setDOMContent(label)
            .addTo(map);
        });
        map.on("mouseleave", "destination-points", () => {
          map.getCanvas().style.cursor = "";
          hoveredDestination = null;
          hoverPopup.remove();
        });
        map.on("click", "destination-points", (event) => {
          const feature = closestMapFeature(event.features, event.point, (coordinates: [number, number]) => map.project(coordinates)); if (!feature) return;
          hoverPopup.remove();
          const wrapper = document.createElement("div"); const name = document.createElement("strong"); name.textContent = String(feature.properties?.name ?? "Park destination");
          const destination = destinationsRef.current.find((item) => item.id === String(feature.properties?.id ?? ""));
          const link = document.createElement("a"); link.href = destination?.href ?? "/explore/"; link.textContent = "View destination";
          wrapper.append(name, document.createElement("br"), link); new maplibre.Popup().setLngLat(event.lngLat).setDOMContent(wrapper).addTo(map);
        });
        if (viewportDestinations.length === 1) map.setCenter([viewportDestinations[0].longitude, viewportDestinations[0].latitude]).setZoom(14);
        else { const bounds = new maplibre.LngLatBounds(); for (const item of viewportDestinations) bounds.extend([item.longitude, item.latitude]); map.fitBounds(bounds, { padding: 52, maxZoom: 14, duration: 0 }); }
        map.once("idle", () => { if (!disposed) setReady(true); });
      });
      map.on("error", () => setError(true));
    } catch { setError(true); } })();
    return () => { disposed = true; resizeObserver?.disconnect(); window.cancelAnimationFrame(resizeFrame); removeMap?.(); };
  }, [destinationSignature, preferCoreCity, styleUrl]);
  if (error) return <div className="usa-alert usa-alert--error" role="alert"><div className="usa-alert__body"><p className="usa-alert__text">The map could not be loaded. All destinations remain available in the list below.</p></div></div>;
  if (!destinations.length) return <div className="usa-alert usa-alert--info" role="status"><div className="usa-alert__body"><p className="usa-alert__text">No destinations are available to show on the map. Remove or change a filter to see mapped results.</p></div></div>;
  return <><ul className="app-map-legend" aria-label="Map marker sizes">
    <li><span className="app-map-legend__dot app-map-legend__dot--major" aria-hidden="true" />Major destination: 10 or more amenities</li>
    <li><span className="app-map-legend__dot" aria-hidden="true" />Other destination</li>
  </ul><div className="app-results-map-stage" aria-busy={!ready}>{!ready && <p className="app-results-map-loading" role="status">Preparing map…</p>}<div className={`app-results-map${ready ? " is-ready" : ""}`} ref={container} /></div></>;
});
