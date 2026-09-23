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
  // Checkout needs an account: it is what ties the order to a customer, so
  // they can track it afterwards from "My orders".
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/checkout")}`);

  const { lines, subtotal } = await getCart();
  if (lines.length === 0) redirect("/cart");

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
    <div className="mx-auto max-w-content px-5 pb-20 pt-36 sm:px-8 lg:px-12">
      <h1 className="mb-10 font-display text-[clamp(2.4rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.02em]">Checkout</h1>
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
