const excludedPlaceTypes = new Set(["Other Non-Park Property", "Library", "Concession"]);
const earthRadiusMiles = 3958.8;

function radians(value) { return value * Math.PI / 180; }

export function distanceMiles(left, right) {
  const latitudeDelta = radians(right.latitude - left.latitude);
  const longitudeDelta = radians(right.longitude - left.longitude);
  const leftLatitude = radians(left.latitude);
  const rightLatitude = radians(right.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(haversine));
}

export function nearbyDestinations(destinations, destinationId, { limit = 4, maxDistanceMiles = 2 } = {}) {
  const origin = destinations.find((destination) => destination.id === destinationId);
  if (!origin?.displayPoint) return [];
  return destinations
    .filter((destination) => destination.id !== destinationId && destination.displayPoint)
    .filter((destination) => !(destination.placeTypes ?? []).every((type) => excludedPlaceTypes.has(type)))
    .map((destination) => ({ destination, distanceMiles: distanceMiles(origin.displayPoint, destination.displayPoint) }))
    .filter((result) => result.distanceMiles >= 0.01 && result.distanceMiles <= maxDistanceMiles)
    .sort((left, right) => left.distanceMiles - right.distanceMiles || left.destination.publicName.localeCompare(right.destination.publicName))
    .slice(0, limit);
}
