export function resultReturnPath(search, destinationId) {
  const params = new URLSearchParams(search);
  params.set("focus", destinationId);
  return `/explore/?${params.toString()}`;
}

export function resultFocusId(destinationId) {
  return `result-${destinationId}`;
}
