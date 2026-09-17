"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSeo } from "@/lib/admin/cms-actions";

type SeoEntry = {
  pageKey: string;
  title: string;
  description: string;
  ogImageUrl: string;
};

// Fixed set of SEO-configurable pages.
const PAGES = [
  { key: "home", label: "Homepage" },
  { key: "shop", label: "Shop" },
  { key: "about", label: "About" },
  { key: "contact", label: "Contact" },
];

export function SeoForm({ entries }: { entries: SeoEntry[] }) {
  const router = useRouter();
  const byKey = new Map(entries.map((e) => [e.pageKey, e]));
  const [active, setActive] = useState(PAGES[0].key);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const current = byKey.get(active) ?? {
    pageKey: active,
    title: "",
    description: "",
    ogImageUrl: "",
  };
  const [form, setForm] = useState<SeoEntry>(current);

  // switch page → load its stored values
  function switchPage(key: string) {
    setActive(key);
    setMsg(null);
    setForm(
      byKey.get(key) ?? {
        pageKey: key,
        title: "",
        description: "",
        ogImageUrl: "",
      }
    );
  }

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await saveSeo({ ...form, pageKey: active });
      setMsg(res.ok ? "Saved." : res.error ?? "Error");
      router.refresh();
    });
  }

  const input =
    "w-full rounded-control border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none";

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex flex-wrap gap-2">
        {PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => switchPage(p.key)}
            className={`rounded-pill border px-3 py-1.5 text-xs ${
              active === p.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            className={input}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            rows={3}
            className={input}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">OG image URL</label>
          <input
            className={input}
            value={form.ogImageUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, ogImageUrl: e.target.value }))
            }
          />
        </div>

        {msg && <p className="text-sm text-success">{msg}</p>}

        <button
          onClick={save}
          disabled={pending}
          className="inline-flex h-11 items-center rounded-pill bg-primary px-8 font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save SEO"}
        </button>
      </div>
    </div>
  );
}
