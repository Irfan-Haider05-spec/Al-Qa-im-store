import type { Prisma } from "@prisma/client";

// Effective price = sale price if present, else base price. Returned as numbers.
export function effectivePrice(product: {
  basePrice: Prisma.Decimal | string | number;
  salePrice: Prisma.Decimal | string | number | null;
}) {
  const base = Number(product.basePrice);
  const sale = product.salePrice != null ? Number(product.salePrice) : null;
  const price = sale ?? base;
  const hasDiscount = sale != null && sale < base;
  const discountPct = hasDiscount
    ? Math.round(((base - sale!) / base) * 100)
    : 0;
  return { base, sale, price, hasDiscount, discountPct };
}

// Average + count from an array of reviews.
export function ratingSummary(reviews: { rating: number }[]) {
  if (!reviews.length) return { average: 0, count: 0 };
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
}

// Sum of available inventory across a product's variants.
export function totalStock(
  variants: { inventory: { available: number } | null }[]
) {
  return variants.reduce(
    (a, v) => a + (v.inventory ? v.inventory.available : 0),
    0
  );
}
