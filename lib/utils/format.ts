// Prices come from Prisma as Decimal (serialized to string). Format safely.
export function formatPrice(
  value: number | string,
  currency = "USD",
  locale = "en-US"
) {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(n);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
