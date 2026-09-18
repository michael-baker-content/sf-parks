export function getActiveParkNotice(document, destinationId, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return document.alerts.find((notice) => notice.destinationId === destinationId && notice.active && (!notice.expiresOn || notice.expiresOn >= today));
}
