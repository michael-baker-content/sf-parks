export function isUsableMapPoint({ latitude, longitude }) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
    && !(latitude === 0 && longitude === 0);
}

export function isCoreSanFranciscoMapPoint({ latitude, longitude }) {
  return isUsableMapPoint({ latitude, longitude })
    && latitude >= 37.69
    && latitude <= 37.84
    && longitude >= -122.54
    && longitude <= -122.34;
}

export function isMajorMapDestination({ amenityCount }) {
  return Number.isFinite(amenityCount) && amenityCount >= 10;
}

export function closestMapFeature(features, pointer, project) {
  return (features ?? []).filter((feature) => feature.geometry.type === "Point").sort((first, second) => {
    const firstPoint = project(first.geometry.coordinates);
    const secondPoint = project(second.geometry.coordinates);
    const firstDistance = (firstPoint.x - pointer.x) ** 2 + (firstPoint.y - pointer.y) ** 2;
    const secondDistance = (secondPoint.x - pointer.x) ** 2 + (secondPoint.y - pointer.y) ** 2;
    return firstDistance - secondDistance;
  })[0];
}

export function initialViewportDestinations(destinations, { preferCoreCity = false } = {}) {
  const usable = destinations.filter(isUsableMapPoint);
  if (!preferCoreCity) return usable;
  const coreCity = usable.filter(isCoreSanFranciscoMapPoint);
  return coreCity.length ? coreCity : usable;
}
