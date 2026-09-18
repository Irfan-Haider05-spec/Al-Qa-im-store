import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getCart } from "@/lib/cart/get-cart";
import { calculateTotals } from "@/lib/orders/totals";
import { getSiteSettings } from "@/lib/settings/site";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { formatPrice } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false },
};

export default async function CartPage() {
  const [{ lines, subtotal, itemCount }, settings] = await Promise.all([
    getCart(),
    getSiteSettings(),
  ]);

  if (lines.length === 0) {
    return (
      <div className="mx-auto grid max-w-content place-items-center px-5 pb-20 pt-40 text-center sm:px-8">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-[2.1rem] font-medium leading-tight tracking-[-0.015em]">
          Your cart is empty
        </h1>
        <p className="mt-2 text-muted-foreground">
          Find your next pair in the shop.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-11 items-center rounded-pill bg-primary px-8 font-medium text-primary-foreground hover:bg-primary-deep"
        >
          Browse shoes
        </Link>
      </div>
    );
  }

  // Same helper the checkout and the order itself use, so the number quoted
  // here is the number that gets charged.
  const { shipping, tax, total, freeShippingGap } = await calculateTotals(subtotal);

  return (
    <div className="mx-auto max-w-content px-5 pb-20 pt-36 sm:px-8 lg:px-12">
      <h1 className="mb-8 font-display text-[clamp(2.4rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.02em]">
        Cart <span className="text-muted-foreground">({itemCount})</span>
      </h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          {lines.map((line) => (
            <CartLineItem key={line.variantId} line={line} />
          ))}
        </div>

        <aside className="h-fit rounded-card border border-border bg-muted/40 p-6">
          <h2 className="font-display text-xl font-semibold">Summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(subtotal, settings.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatPrice(shipping, settings.currency)}</dd>
            </div>
            {freeShippingGap != null && (
              <p className="text-xs text-muted-foreground">
                Add {formatPrice(freeShippingGap, settings.currency)} more for free
                delivery.
              </p>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tax</dt>
                <dd>{formatPrice(tax, settings.currency)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(total, settings.currency)}</dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="mt-6 flex h-12 items-center justify-center rounded-pill bg-primary font-medium text-primary-foreground hover:bg-primary-deep"
          >
            Checkout
          </Link>
          <Link
            href="/shop"
            className="mt-3 flex h-11 items-center justify-center rounded-pill border border-border text-sm hover:bg-background"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
