import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCart } from "@/lib/cart/get-cart";
import { getCurrentUser } from "@/lib/auth/session";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const { lines, subtotal } = await getCart();
  if (lines.length === 0) redirect("/cart");

  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-content px-5 pb-20 pt-28 sm:px-8">
      <h1 className="mb-8 font-display text-4xl font-bold">Checkout</h1>
      <CheckoutForm
        lines={lines}
        subtotal={subtotal}
        defaultEmail={user?.email ?? undefined}
      />
    </div>
  );
}
