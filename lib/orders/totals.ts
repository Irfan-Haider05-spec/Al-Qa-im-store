import { prisma } from "@/lib/db/prisma";
import { getSiteSettings } from "@/lib/settings/site";

export type OrderTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  /** How much more the basket needs for free delivery, or null if it qualifies. */
  freeShippingGap: number | null;
};

export type CouponCheck =
  | { ok: true; couponId: string; discount: number }
  | { ok: false; error: string };

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Validates a coupon against everything the schema allows — active flag,
 * expiry, minimum order, total usage cap and the per-customer cap.
 *
 * The discount is always recomputed here from the stored coupon row. A value
 * that arrived from the browser is a number the customer picked, not a price.
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
  userId: string | null
): Promise<CouponCheck> {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    return { ok: false, error: "That coupon code isn't valid." };
  }
  if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
    return { ok: false, error: "That coupon has expired." };
  }
  if (coupon.minOrder && subtotal < Number(coupon.minOrder)) {
    return {
      ok: false,
      error: `This coupon needs a subtotal of at least $${Number(coupon.minOrder).toFixed(2)}.`,
    };
  }

  if (coupon.usageLimit != null) {
    const used = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
    if (used >= coupon.usageLimit) {
      return { ok: false, error: "This coupon has been fully redeemed." };
    }
  }

  if (coupon.perUserLimit != null && userId) {
    const usedByUser = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (usedByUser >= coupon.perUserLimit) {
      return { ok: false, error: "You've already used this coupon." };
    }
  }

  const raw =
    coupon.type === "PERCENT"
      ? (subtotal * Number(coupon.value)) / 100
      : Number(coupon.value);

  return { ok: true, couponId: coupon.id, discount: round(Math.min(raw, subtotal)) };
}

/**
 * The single place order money is worked out.
 *
 * The cart summary, the checkout summary and `placeOrder` all call this, so the
 * figure a customer is quoted and the figure that is charged cannot drift apart
 * — and changing shipping or tax in Admin → Settings moves all three at once.
 *
 * Tax is applied after the discount and before shipping, which is the common
 * arrangement; a store whose jurisdiction taxes delivery should change it here,
 * once, rather than in each caller.
 */
export async function calculateTotals(
  subtotal: number,
  discount = 0
): Promise<OrderTotals> {
  const settings = await getSiteSettings();

  const taxable = Math.max(0, subtotal - discount);
  const tax = round(taxable * settings.taxRate);

  const qualifies =
    settings.freeShippingThreshold != null &&
    taxable >= settings.freeShippingThreshold;
  const shipping = qualifies ? 0 : settings.flatShipping;

  const freeShippingGap =
    settings.freeShippingThreshold == null || qualifies
      ? null
      : round(settings.freeShippingThreshold - taxable);

  return {
    subtotal: round(subtotal),
    discount: round(discount),
    shipping: round(shipping),
    tax,
    total: round(taxable + tax + shipping),
    freeShippingGap,
  };
}
