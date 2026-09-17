"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { createBanner, toggleBanner, deleteBanner } from "@/lib/admin/cms-actions";
import { ImageUpload } from "@/components/admin/image-upload";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  isActive: boolean;
  startAt: Date | null;
  endAt: Date | null;
};

const blank = {
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaLabel: "",
  ctaUrl: "",
  startAt: "",
  endAt: "",
};

export function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [form, setForm] = useState(blank);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (k: keyof typeof blank, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function create() {
    setError(null);
    startTransition(async () => {
      const res = await createBanner({ ...form, isActive: true });
      if (res.ok) {
        setForm(blank);
        router.refresh();
      } else {
        setError(res.error ?? "Error");
      }
    });
  }

  const input =
    "w-full rounded-control border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none";

  return (
    <div className="space-y-8">
      <div className="max-w-xl space-y-4 rounded-card border border-border bg-background p-5">
        <h2 className="font-display text-lg font-semibold">New banner</h2>
        <input className={input} placeholder="Title" value={form.title} onChange={(e) => set("title", e.target.value)} />
        <input className={input} placeholder="Subtitle (optional)" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
        <ImageUpload value={form.imageUrl} onChange={(url) => set("imageUrl", url)} label="Banner image" />
        <div className="grid grid-cols-2 gap-4">
          <input className={input} placeholder="CTA label" value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
          <input className={input} placeholder="CTA URL" value={form.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Start</label>
            <input type="date" className={input} value={form.startAt} onChange={(e) => set("startAt", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">End</label>
            <input type="date" className={input} value={form.endAt} onChange={(e) => set("endAt", e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          onClick={create}
          disabled={pending || !form.title || !form.imageUrl}
          className="inline-flex h-10 items-center rounded-pill bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
        >
          Add banner
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-card border border-border bg-background">
            <div className="relative h-32 bg-muted">
              {b.imageUrl && (
                <Image src={b.imageUrl} alt={b.title} fill className="object-cover" />
              )}
            </div>
            <div className="p-4">
              <p className="font-medium">{b.title}</p>
              {b.subtitle && (
                <p className="text-sm text-muted-foreground">{b.subtitle}</p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await toggleBanner(b.id, !b.isActive);
                      router.refresh();
                    })
                  }
                  className={`rounded-pill px-2.5 py-0.5 text-xs ${
                    b.isActive
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {b.isActive ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await deleteBanner(b.id);
                      router.refresh();
                    })
                  }
                  aria-label="Delete banner"
                  className="text-danger hover:opacity-70"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
