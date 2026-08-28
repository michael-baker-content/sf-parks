export function googleMapsSearchUrl(latitude, longitude) {
  const params = new URLSearchParams({ api: "1", query: `${latitude},${longitude}` });
  return `https://www.google.com/maps/search/?${params}`;
}

export function googleMapsDirectionsUrl(latitude, longitude) {
  const params = new URLSearchParams({ api: "1", destination: `${latitude},${longitude}` });
  return `https://www.google.com/maps/dir/?${params}`;
}

export function googleMapsEmbedUrl(apiKey, latitude, longitude) {
  const params = new URLSearchParams({ key: apiKey, q: `${latitude},${longitude}` });
  return `https://www.google.com/maps/embed/v1/place?${params}`;
}
