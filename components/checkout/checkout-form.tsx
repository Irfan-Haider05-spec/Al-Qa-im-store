"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { placeOrder } from "@/lib/orders/actions";
import { formatPrice } from "@/lib/utils/format";
import type { CartLine } from "@/lib/cart/get-cart";

const FIELDS: { name: keyof FormState; label: string; type?: string; half?: boolean }[] = [
  { name: "fullName", label: "Full name" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "line1", label: "Address" },
  { name: "line2", label: "Apartment, suite (optional)" },
  { name: "city", label: "City", half: true },
  { name: "state", label: "State / Province", half: true },
  { name: "postalCode", label: "Postal code", half: true },
  { name: "country", label: "Country", half: true },
];

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const empty: FormState = {
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export function CheckoutForm({
  lines,
  subtotal,
  defaultEmail,
}: {
  lines: CartLine[];
  subtotal: number;
  defaultEmail?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    ...empty,
    email: defaultEmail ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const FREE_SHIP = 100;
  const shipping = subtotal >= FREE_SHIP ? 0 : 5;
  const total = subtotal + shipping;

  const set = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await placeOrder({
        ...form,
        paymentMethod: "COD",
        couponCode: "",
      });
      if (res.ok) {
        router.push(`/checkout/success?order=${res.orderNumber}`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      {/* form */}
      <div>
        <h2 className="font-display text-xl font-semibold">Shipping details</h2>
        <div className="mt-5 grid grid-cols-2 gap-4">
          {FIELDS.map((f) => (
            <div key={f.name} className={f.half ? "col-span-1" : "col-span-2"}>
              <label className="mb-1 block text-sm font-medium">
                {f.label}
              </label>
              <input
                type={f.type ?? "text"}
                value={form[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
                className="w-full rounded-control border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          ))}
        </div>

        <h2 className="mt-8 font-display text-xl font-semibold">Payment</h2>
        <div className="mt-4 rounded-control border border-border p-4">
          <label className="flex items-center gap-3 text-sm">
            <input type="radio" checked readOnly className="accent-[var(--primary)]" />
            <span>
              <span className="font-medium">Cash on Delivery</span>
              <span className="block text-muted-foreground">
                Pay when your order arrives.
              </span>
            </span>
          </label>
          <p className="mt-3 text-xs text-muted-foreground">
            Online card payment isn&apos;t configured yet — it slots in behind the
            same checkout once a provider is added.
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      {/* summary */}
      <aside className="h-fit rounded-card border border-border bg-muted/40 p-6">
        <h2 className="font-display text-lg font-semibold">Your order</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((l) => (
            <li key={l.variantId} className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                {l.productName}{" "}
                <span className="text-xs">×{l.quantity}</span>
              </span>
              <span>{formatPrice(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>

        <button
          onClick={submit}
          disabled={pending}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-pill bg-primary font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
        >
          {pending ? "Placing order…" : "Place order"}
        </button>
      </aside>
    </div>
  );
}
