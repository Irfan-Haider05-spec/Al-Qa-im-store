"use server";

import { getCart } from "@/lib/cart/get-cart";
import { getCurrentUser } from "@/lib/auth/session";
import { calculateTotals, validateCoupon } from "@/lib/orders/totals";

export type ApplyCouponResult =
  | {
      ok: true;
      code: string;
      discount: number;
      shipping: number;
      tax: number;
      total: number;
    }
  | { ok: false; error: string };

/**
 * Prices the current cart with a coupon applied, for the checkout summary.
 *
 * This only *previews* the discount — `placeOrder` validates the code again
 * and recomputes every figure from the database when the order is actually
 * written. A customer who tampers with the preview changes what they see and
 * nothing else.
 */
export async function applyCoupon(code: string): Promise<ApplyCouponResult> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: "Enter a coupon code." };

  const [{ subtotal, lines }, user] = await Promise.all([
    getCart(),
    getCurrentUser(),
  ]);
  if (lines.length === 0) return { ok: false, error: "Your cart is empty." };

  const check = await validateCoupon(trimmed, subtotal, user?.id ?? null);
  if (!check.ok) return { ok: false, error: check.error };

  const totals = await calculateTotals(subtotal, check.discount);

  return {
    ok: true,
    code: trimmed.toUpperCase(),
    discount: totals.discount,
    shipping: totals.shipping,
    tax: totals.tax,
    total: totals.total,
  };
}
