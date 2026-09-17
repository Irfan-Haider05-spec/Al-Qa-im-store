"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveHomepage } from "@/lib/admin/cms-actions";

type Product = { id: string; name: string };

export function HomepageEditor({
  initial,
  weeklyPickCandidates,
}: {
  initial: {
    heroHeading: string;
    heroSubheading: string;
    heroDescription: string;
    heroCtaLabel: string;
    heroCtaUrl: string;
    weeklyPickHeading: string;
    weeklyPickDesc: string;
    weeklyPickProductId: string;
    membershipHeading: string;
    membershipCtaLabel: string;
    membershipCtaUrl: string;
  };
  weeklyPickCandidates: Product[];
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
      const res = await saveHomepage(form);
      if (res.ok) {
        setMsg({ ok: true, text: "Homepage saved. Storefront updated." });
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
      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Hero</h2>
        <div>
          <label className={label}>Heading</label>
          <input className={input} value={form.heroHeading} onChange={(e) => set("heroHeading", e.target.value)} />
        </div>
        <div>
          <label className={label}>Subheading</label>
          <input className={input} value={form.heroSubheading} onChange={(e) => set("heroSubheading", e.target.value)} />
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea rows={2} className={input} value={form.heroDescription} onChange={(e) => set("heroDescription", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>CTA label</label>
            <input className={input} value={form.heroCtaLabel} onChange={(e) => set("heroCtaLabel", e.target.value)} />
          </div>
          <div>
            <label className={label}>CTA URL</label>
            <input className={input} value={form.heroCtaUrl} onChange={(e) => set("heroCtaUrl", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Weekly Pick</h2>
        <div>
          <label className={label}>Heading</label>
          <input className={input} value={form.weeklyPickHeading} onChange={(e) => set("weeklyPickHeading", e.target.value)} />
        </div>
        <div>
          <label className={label}>Description</label>
          <input className={input} value={form.weeklyPickDesc} onChange={(e) => set("weeklyPickDesc", e.target.value)} />
        </div>
        <div>
          <label className={label}>Selected product</label>
          <select className={input} value={form.weeklyPickProductId} onChange={(e) => set("weeklyPickProductId", e.target.value)}>
            <option value="">— none —</option>
            {weeklyPickCandidates.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Membership CTA</h2>
        <div>
          <label className={label}>Heading</label>
          <input className={input} value={form.membershipHeading} onChange={(e) => set("membershipHeading", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>CTA label</label>
            <input className={input} value={form.membershipCtaLabel} onChange={(e) => set("membershipCtaLabel", e.target.value)} />
          </div>
          <div>
            <label className={label}>CTA URL</label>
            <input className={input} value={form.membershipCtaUrl} onChange={(e) => set("membershipCtaUrl", e.target.value)} />
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
        {pending ? "Saving…" : "Save homepage"}
      </button>
    </div>
  );
}
