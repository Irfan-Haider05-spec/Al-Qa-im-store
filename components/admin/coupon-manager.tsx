"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  createCoupon,
  toggleCoupon,
  deleteCoupon,
} from "@/lib/admin/coupon-actions";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: unknown;
  minOrder: unknown;
  usageLimit: number | null;
  expiresAt: Date | null;
  isActive: boolean;
  _count: { usages: number };
};

const blank = {
  code: "",
  type: "PERCENT",
  value: "",
  minOrder: "",
  usageLimit: "",
  perUserLimit: "",
  expiresAt: "",
};

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [form, setForm] = useState(blank);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (k: keyof typeof blank, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function create() {
    setError(null);
    startTransition(async () => {
      const res = await createCoupon({
        code: form.code,
        type: form.type as "PERCENT" | "FIXED",
        value: form.value,
        minOrder: form.minOrder || null,
        usageLimit: form.usageLimit || null,
        perUserLimit: form.perUserLimit || null,
        expiresAt: form.expiresAt || null,
        isActive: true,
      });
      if (res.ok) {
        setForm(blank);
        router.refresh();
      } else {
        setError(res.error ?? "Error");
      }
    });
  }

  const input =
    "rounded-control border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-border bg-background p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            className={input}
            placeholder="CODE"
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
          />
          <select
            className={input}
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          >
            <option value="PERCENT">Percent %</option>
            <option value="FIXED">Fixed $</option>
          </select>
          <input
            className={input}
            type="number"
            placeholder="Value"
            value={form.value}
            onChange={(e) => set("value", e.target.value)}
          />
          <input
            className={input}
            type="number"
            placeholder="Min order (opt)"
            value={form.minOrder}
            onChange={(e) => set("minOrder", e.target.value)}
          />
          <input
            className={input}
            type="number"
            placeholder="Usage limit (opt)"
            value={form.usageLimit}
            onChange={(e) => set("usageLimit", e.target.value)}
          />
          <input
            className={input}
            type="number"
            placeholder="Per-user limit (opt)"
            value={form.perUserLimit}
            onChange={(e) => set("perUserLimit", e.target.value)}
          />
          <input
            className={input}
            type="date"
            placeholder="Expires"
            value={form.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
          />
          <button
            onClick={create}
            disabled={pending || !form.code || !form.value}
            className="inline-flex h-10 items-center justify-center rounded-pill bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
          >
            Add coupon
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Min order</th>
              <th className="px-4 py-3 font-medium">Used</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{c.code}</td>
                <td className="px-4 py-3">
                  {c.type === "PERCENT"
                    ? `${Number(c.value)}%`
                    : `$${Number(c.value)}`}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.minOrder ? `$${Number(c.minOrder)}` : "—"}
                </td>
                <td className="px-4 py-3">
                  {c._count.usages}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.expiresAt
                    ? new Date(c.expiresAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await toggleCoupon(c.id, !c.isActive);
                        router.refresh();
                      })
                    }
                    className={`rounded-pill px-2.5 py-0.5 text-xs ${
                      c.isActive
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await deleteCoupon(c.id);
                        router.refresh();
                      })
                    }
                    aria-label="Delete coupon"
                    className="text-danger hover:opacity-70"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
