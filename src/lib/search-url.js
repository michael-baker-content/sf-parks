export function searchUrl(value) {
  const query = String(value ?? "").trim();
  return query ? `/explore/?q=${encodeURIComponent(query)}` : "/explore/";
}
