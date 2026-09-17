import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getCart } from "@/lib/cart/get-cart";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { formatPrice } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false },
};

const FREE_SHIP_THRESHOLD = 100;
const FLAT_SHIP = 5;

export default async function CartPage() {
  const { lines, subtotal, itemCount } = await getCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto grid max-w-content place-items-center px-5 pb-20 pt-40 text-center sm:px-8">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-3xl font-bold">
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

  const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : FLAT_SHIP;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-content px-5 pb-20 pt-28 sm:px-8">
      <h1 className="mb-8 font-display text-4xl font-bold">
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
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-muted-foreground">
                Add {formatPrice(FREE_SHIP_THRESHOLD - subtotal)} more for free
                shipping.
              </p>
            )}
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
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
