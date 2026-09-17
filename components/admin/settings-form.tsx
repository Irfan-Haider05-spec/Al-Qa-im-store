"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/lib/admin/cms-actions";

export function SettingsForm({
  initial,
}: {
  initial: {
    storeName: string;
    logoUrl: string;
    contactEmail: string;
    phone: string;
    address: string;
    currency: string;
    flatShipping: string;
    freeShippingThreshold: string;
    taxRate: string;
    instagram: string;
    facebook: string;
    youtube: string;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await saveSettings({
        ...form,
        flatShipping: form.flatShipping || null,
        freeShippingThreshold: form.freeShippingThreshold || null,
        taxRate: form.taxRate || null,
      });
      if (res.ok) {
        setMsg({ ok: true, text: "Settings saved." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error ?? "Error" });
      }
    });
  }

  const input =
    "w-full rounded-control border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none";
  const label = "mb-1 block text-sm font-medium";

  return (
    <div className="max-w-2xl space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>Store name</label>
          <input className={input} value={form.storeName} onChange={(e) => set("storeName", e.target.value)} />
        </div>
        <div>
          <label className={label}>Contact email</label>
          <input className={input} value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </div>
        <div>
          <label className={label}>Phone</label>
          <input className={input} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Address</label>
          <input className={input} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <label className={label}>Currency</label>
          <input className={input} value={form.currency} onChange={(e) => set("currency", e.target.value)} />
        </div>
        <div>
          <label className={label}>Logo URL</label>
          <input className={input} value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Shipping & tax</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>Flat shipping ($)</label>
            <input type="number" step="0.01" className={input} value={form.flatShipping} onChange={(e) => set("flatShipping", e.target.value)} />
          </div>
          <div>
            <label className={label}>Free ship over ($)</label>
            <input type="number" step="0.01" className={input} value={form.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", e.target.value)} />
          </div>
          <div>
            <label className={label}>Tax rate (0–1)</label>
            <input type="number" step="0.0001" className={input} value={form.taxRate} onChange={(e) => set("taxRate", e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Social links</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>Instagram</label>
            <input className={input} value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
          </div>
          <div>
            <label className={label}>Facebook</label>
            <input className={input} value={form.facebook} onChange={(e) => set("facebook", e.target.value)} />
          </div>
          <div>
            <label className={label}>YouTube</label>
            <input className={input} value={form.youtube} onChange={(e) => set("youtube", e.target.value)} />
          </div>
        </div>
      </section>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>
          {msg.text}
        </p>
      )}

      <button
        onClick={save}
        disabled={pending}
        className="inline-flex h-11 items-center rounded-pill bg-primary px-8 font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
