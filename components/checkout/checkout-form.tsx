"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Loader2, Tag, X } from "lucide-react";
import { placeOrder } from "@/lib/orders/actions";
import { applyCoupon } from "@/lib/orders/coupon-actions";
import { formatPrice } from "@/lib/utils/format";
import { addressSchema } from "@/lib/validations/checkout";
import type { CartLine } from "@/lib/cart/get-cart";
import { cn } from "@/lib/utils/cn";

const FIELDS: {
  name: keyof FormState;
  label: string;
  type?: string;
  half?: boolean;
  autoComplete: string;
}[] = [
  { name: "fullName", label: "Full name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", half: true },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel", half: true },
  { name: "line1", label: "Address", autoComplete: "address-line1" },
  { name: "line2", label: "Apartment, suite (optional)", autoComplete: "address-line2" },
  { name: "city", label: "City", half: true, autoComplete: "address-level2" },
  { name: "state", label: "State / Province", half: true, autoComplete: "address-level1" },
  { name: "postalCode", label: "Postal code", half: true, autoComplete: "postal-code" },
  { name: "country", label: "Country", half: true, autoComplete: "country-name" },
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

export type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export type CheckoutTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  freeShippingGap: number | null;
};

const EMPTY: FormState = {
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
  totals: initialTotals,
  defaultEmail,
  savedAddresses,
  currency = "USD",
}: {
  lines: CartLine[];
  totals: CheckoutTotals;
  defaultEmail?: string;
  savedAddresses: SavedAddress[];
  currency?: string;
}) {
  const router = useRouter();
  const preset = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];

  const [form, setForm] = useState<FormState>(
    preset
      ? {
          fullName: preset.fullName,
          email: defaultEmail ?? "",
          phone: preset.phone,
          line1: preset.line1,
          line2: preset.line2 ?? "",
          city: preset.city,
          state: preset.state ?? "",
          postalCode: preset.postalCode,
          country: preset.country,
        }
      : { ...EMPTY, email: defaultEmail ?? "" }
  );

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [totals, setTotals] = useState(initialTotals);
  const [couponPending, startCoupon] = useTransition();

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  };

  const applySavedAddress = (address: SavedAddress) =>
    setForm((f) => ({
      ...f,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state ?? "",
      postalCode: address.postalCode,
      country: address.country,
    }));

  const onApplyCoupon = () =>
    startCoupon(async () => {
      setCouponError(null);
      const result = await applyCoupon(couponInput);
      if (!result.ok) {
        setCouponError(result.error);
        return;
      }
      setAppliedCode(result.code);
      setCouponInput("");
      setTotals((t) => ({
        ...t,
        discount: result.discount,
        shipping: result.shipping,
        tax: result.tax,
        total: result.total,
      }));
    });

  const onRemoveCoupon = () => {
    setAppliedCode(null);
    setCouponError(null);
    setTotals(initialTotals);
  };

  const submit = () => {
    setError(null);

    // Validate against the same schema the server action uses, so the customer
    // sees the problem next to the field instead of one message at the bottom.
    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) {
      const errors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState;
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      setError("Please check the highlighted fields.");
      return;
    }

    startTransition(async () => {
      const result = await placeOrder({
        ...form,
        paymentMethod: "COD",
        couponCode: appliedCode ?? "",
      });
      if (result.ok) {
        router.push(`/checkout/success?order=${result.orderNumber}`);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        {savedAddresses.length > 0 && (
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold">Saved addresses</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {savedAddresses.map((address) => (
                <li key={address.id}>
                  <button
                    type="button"
                    onClick={() => applySavedAddress(address)}
                    className="w-full rounded-card border border-border p-4 text-left text-sm transition-colors hover:border-primary"
                  >
                    <span className="font-medium">{address.fullName}</span>
                    {address.isDefault && (
                      <span className="ml-2 rounded-pill bg-primary/10 px-2 py-0.5 text-xs text-primary-deep">
                        Default
                      </span>
                    )}
                    <span className="mt-1 block text-muted-foreground">
                      {address.line1}, {address.city} {address.postalCode}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <h2 className="font-display text-xl font-semibold">Shipping details</h2>
        <div className="mt-5 grid grid-cols-2 gap-4">
          {FIELDS.map((field) => {
            const invalid = Boolean(fieldErrors[field.name]);
            return (
              <div
                key={field.name}
                className={field.half ? "col-span-2 sm:col-span-1" : "col-span-2"}
              >
                <label
                  htmlFor={`checkout-${field.name}`}
                  className="mb-1 block text-sm font-medium"
                >
                  {field.label}
                </label>
                <input
                  id={`checkout-${field.name}`}
                  type={field.type ?? "text"}
                  autoComplete={field.autoComplete}
                  value={form[field.name]}
                  onChange={(e) => set(field.name, e.target.value)}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? `checkout-${field.name}-error` : undefined}
                  className={cn(
                    "w-full rounded-control border px-3 py-2.5 text-sm focus:outline-none",
                    invalid
                      ? "border-danger focus:border-danger"
                      : "border-border focus:border-primary"
                  )}
                />
                {invalid && (
                  <p
                    id={`checkout-${field.name}-error`}
                    className="mt-1 text-xs text-danger"
                  >
                    {fieldErrors[field.name]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <h2 className="mt-8 font-display text-xl font-semibold">Payment</h2>
        <div className="mt-4 rounded-card border border-border p-4">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="payment"
              checked
              readOnly
              className="mt-1 accent-primary"
            />
            <span>
              <span className="font-medium">Cash on delivery</span>
              <span className="block text-muted-foreground">
                Pay the courier when your order arrives.
              </span>
            </span>
          </label>
          <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            Card payment is not configured on this store. Checkout talks to a
            payment provider interface, so adding one is a config change rather
            than a rewrite — see the README.
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <aside className="h-fit rounded-card border border-border bg-muted/40 p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-semibold">Your order</h2>

        <ul className="mt-4 space-y-3">
          {lines.map((line) => (
            <li key={line.variantId} className="flex items-center gap-3 text-sm">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-background">
                {line.imageUrl && (
                  <Image src={line.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{line.productName}</span>
                <span className="block text-xs text-muted-foreground">
                  {[line.colorName, line.sizeLabel].filter(Boolean).join(" · ")} · ×{line.quantity}
                </span>
              </span>
              <span>{formatPrice(line.lineTotal, currency)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-border pt-4">
          {appliedCode ? (
            <div className="flex items-center justify-between rounded-control bg-success/10 px-3 py-2 text-sm text-success">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" aria-hidden />
                {appliedCode} applied
              </span>
              <button
                type="button"
                onClick={onRemoveCoupon}
                aria-label={`Remove coupon ${appliedCode}`}
                className="text-success/70 transition-colors hover:text-success"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <label htmlFor="coupon" className="mb-1 block text-sm font-medium">
                Coupon code
              </label>
              <div className="flex gap-2">
                <input
                  id="coupon"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onApplyCoupon();
                    }
                  }}
                  placeholder="WELCOME20"
                  className="w-full rounded-control border border-border bg-background px-3 py-2 text-sm uppercase focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onApplyCoupon}
                  disabled={couponPending || !couponInput.trim()}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-control border border-border bg-background px-4 text-sm font-medium transition-colors hover:border-primary disabled:opacity-50"
                >
                  {couponPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Tag className="h-4 w-4" aria-hidden />
                  )}
                  Apply
                </button>
              </div>
              {couponError && (
                <p role="alert" className="mt-1.5 text-xs text-danger">
                  {couponError}
                </p>
              )}
            </div>
          )}
        </div>

        <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatPrice(totals.subtotal, currency)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-success">
              <dt>Discount</dt>
              <dd>−{formatPrice(totals.discount, currency)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{totals.shipping === 0 ? "Free" : formatPrice(totals.shipping, currency)}</dd>
          </div>
          {totals.tax > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd>{formatPrice(totals.tax, currency)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(totals.total, currency)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {pending ? "Placing order…" : "Place order"}
        </button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Totals are recalculated on the server when the order is placed.
        </p>
      </aside>
    </div>
  );
}
