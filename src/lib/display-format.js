const acreageFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const reviewedDateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function amenityQuantityText(amenity) {
  if (amenity.quantityStatus !== "official-page-verified") return amenity.label;
  return `${amenity.quantity} ${(amenity.quantity === 1 ? amenity.label : `${amenity.label}s`).toLowerCase()}`;
}

export function acreageText(value) {
  return acreageFormatter.format(value);
}

export function reviewedDateText(value) {
  return reviewedDateFormatter.format(new Date(value.includes("T") ? value : `${value}T00:00:00`));
}
