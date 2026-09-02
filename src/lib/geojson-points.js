function onSegment(point, first, second) {
  const cross = (point.longitude - first[0]) * (second[1] - first[1])
    - (point.latitude - first[1]) * (second[0] - first[0]);
  if (Math.abs(cross) > 1e-10) return false;
  return point.longitude >= Math.min(first[0], second[0]) - 1e-10
    && point.longitude <= Math.max(first[0], second[0]) + 1e-10
    && point.latitude >= Math.min(first[1], second[1]) - 1e-10
    && point.latitude <= Math.max(first[1], second[1]) + 1e-10;
}

function pointInRing(point, ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const first = ring[previous];
    const second = ring[index];
    if (onSegment(point, first, second)) return true;
    const intersects = (second[1] > point.latitude) !== (first[1] > point.latitude)
      && point.longitude < ((first[0] - second[0]) * (point.latitude - second[1])) / (first[1] - second[1]) + second[0];
    if (intersects) inside = !inside;
  }
  return inside;
}

function polygons(shape) {
  if (shape?.type === "Polygon") return [shape.coordinates];
  if (shape?.type === "MultiPolygon") return shape.coordinates;
  return [];
}

function pointInPolygon(point, polygon) {
  if (!polygon?.[0]?.length || !pointInRing(point, polygon[0])) return false;
  return !polygon.slice(1).some((hole) => pointInRing(point, hole));
}

export function geometryContainsPoint(shape, point) {
  return polygons(shape).some((polygon) => pointInPolygon(point, polygon));
}

function ringAreaAndCentroid(ring) {
  let twiceArea = 0;
  let longitudeSum = 0;
  let latitudeSum = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [firstLongitude, firstLatitude] = ring[index];
    const [secondLongitude, secondLatitude] = ring[index + 1];
    const cross = firstLongitude * secondLatitude - secondLongitude * firstLatitude;
    twiceArea += cross;
    longitudeSum += (firstLongitude + secondLongitude) * cross;
    latitudeSum += (firstLatitude + secondLatitude) * cross;
  }
  if (Math.abs(twiceArea) < 1e-14) return null;
  return {
    area: Math.abs(twiceArea / 2),
    point: { longitude: longitudeSum / (3 * twiceArea), latitude: latitudeSum / (3 * twiceArea) },
  };
}

export function representativeGeometryPoint(shape) {
  const candidates = polygons(shape)
    .map((polygon) => ({ polygon, measure: ringAreaAndCentroid(polygon[0]) }))
    .filter((item) => item.measure)
    .sort((first, second) => second.measure.area - first.measure.area);
  if (!candidates.length) return null;
  const { polygon, measure } = candidates[0];
  if (pointInPolygon(measure.point, polygon)) return measure.point;

  const ring = polygon[0];
  const longitudes = ring.map(([longitude]) => longitude);
  const latitudes = ring.map(([, latitude]) => latitude);
  const bounds = {
    west: Math.min(...longitudes), east: Math.max(...longitudes),
    south: Math.min(...latitudes), north: Math.max(...latitudes),
  };
  const insideCandidates = [];
  for (let row = 1; row < 40; row += 1) {
    for (let column = 1; column < 40; column += 1) {
      const point = {
        longitude: bounds.west + (bounds.east - bounds.west) * column / 40,
        latitude: bounds.south + (bounds.north - bounds.south) * row / 40,
      };
      if (pointInPolygon(point, polygon)) insideCandidates.push(point);
    }
  }
  insideCandidates.sort((first, second) => {
    const firstDistance = (first.longitude - measure.point.longitude) ** 2 + (first.latitude - measure.point.latitude) ** 2;
    const secondDistance = (second.longitude - measure.point.longitude) ** 2 + (second.latitude - measure.point.latitude) ** 2;
    return firstDistance - secondDistance;
  });
  return insideCandidates[0] ?? { longitude: ring[0][0], latitude: ring[0][1] };
}
