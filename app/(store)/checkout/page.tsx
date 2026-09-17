import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCart } from "@/lib/cart/get-cart";
import { getCurrentUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/settings/site";
import { calculateTotals } from "@/lib/orders/totals";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const { lines, subtotal } = await getCart();
  if (lines.length === 0) redirect("/cart");

  const user = await getCurrentUser();

  const [totals, settings, savedAddresses] = await Promise.all([
    calculateTotals(subtotal),
    getSiteSettings(),
    user
      ? prisma.address.findMany({
          where: { userId: user.id },
          orderBy: [{ isDefault: "desc" }, { id: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-content px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
      <h1 className="mb-8 font-display text-4xl font-bold uppercase">Checkout</h1>
      <CheckoutForm
        lines={lines}
        totals={totals}
        currency={settings.currency}
        defaultEmail={user?.email ?? undefined}
        savedAddresses={savedAddresses}
      />
    </div>
  );
}
