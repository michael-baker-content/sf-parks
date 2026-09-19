export function resultReturnPath(search, destinationId) {
  const params = new URLSearchParams(search);
  params.set("focus", destinationId);
  return `/explore/?${params.toString()}`;
}

export function resultFocusId(destinationId) {
  return `result-${destinationId}`;
}

export function validResultReturnPath(candidate) {
  return typeof candidate === "string" && /^\/explore\/(?:\?[^#]*)?(?:#.*)?$/.test(candidate) ? candidate : null;
}
