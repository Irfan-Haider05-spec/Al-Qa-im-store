import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <div className="mx-auto grid max-w-content place-items-center px-5 pb-20 pt-40 text-center sm:px-8">
      <CheckCircle2 className="h-14 w-14 text-success" />
      <h1 className="mt-4 font-display text-[2.1rem] font-medium leading-tight tracking-[-0.015em]">Thank you!</h1>
      <p className="mt-2 text-muted-foreground">
        Your order has been placed and is pending confirmation.
      </p>
      {order && (
        <p className="mt-1 text-sm">
          Order number: <span className="font-semibold">{order}</span>
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <Link
          href="/account/orders"
          className="inline-flex h-11 items-center rounded-pill bg-primary px-6 font-medium text-primary-foreground hover:bg-primary-deep"
        >
          View my orders
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-11 items-center rounded-pill border border-border px-6 text-sm hover:bg-muted"
        >
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
