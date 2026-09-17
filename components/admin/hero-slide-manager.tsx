"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import {
  createHeroSlide,
  deleteHeroSlide,
  moveHeroSlide,
  updateHeroSlide,
} from "@/lib/admin/cms-actions";

export type HeroSlideRow = {
  id: string;
  imageUrl: string;
  productId: string | null;
  durationMs: number;
  isActive: boolean;
  position: number;
};

const input =
  "w-full rounded-control border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none";

/**
 * Hero carousel management.
 *
 * Every field here drives the storefront hero directly — the image, which
 * product the slide links to, how long it holds before advancing and whether
 * it runs at all. Cut-out PNGs with a transparent background work best; the
 * shoe floats over the brand circle rather than sitting in a box.
 */
export function HeroSlideManager({
  slides,
  products,
}: {
  slides: HeroSlideRow[];
  products: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [draft, setDraft] = useState({
    imageUrl: "",
    productId: "",
    durationMs: 1000,
    isActive: true,
  });

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await fn();
      setMessage(
        result.ok
          ? { ok: true, text: success }
          : { ok: false, text: result.error ?? "Something went wrong" }
      );
      if (result.ok) router.refresh();
    });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold">Hero slides</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          The rotating shoes in the homepage hero. Transparent PNG cut-outs look
          best — {slides.filter((s) => s.isActive).length} active.
        </p>
      </div>

      <ul className="space-y-3">
        {slides.map((slide, index) => (
          <li
            key={slide.id}
            className="flex flex-wrap items-center gap-4 rounded-card border border-border bg-background p-4"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-control bg-muted">
              <Image
                src={slide.imageUrl}
                alt=""
                fill
                sizes="80px"
                className="object-contain"
              />
            </div>

            <div className="min-w-[10rem] flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Links to product
              </label>
              <select
                className={input}
                defaultValue={slide.productId ?? ""}
                disabled={pending}
                onChange={(e) =>
                  run(
                    () => updateHeroSlide(slide.id, { productId: e.target.value }),
                    "Slide updated."
                  )
                }
              >
                <option value="">Shop page</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-32">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Hold (ms)
              </label>
              <input
                type="number"
                min={600}
                max={20000}
                step={100}
                defaultValue={slide.durationMs}
                disabled={pending}
                className={input}
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (value === slide.durationMs) return;
                  run(
                    () => updateHeroSlide(slide.id, { durationMs: value }),
                    "Timing updated."
                  );
                }}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked={slide.isActive}
                disabled={pending}
                className="h-4 w-4 accent-primary"
                onChange={(e) =>
                  run(
                    () => updateHeroSlide(slide.id, { isActive: e.target.checked }),
                    e.target.checked ? "Slide activated." : "Slide hidden."
                  )
                }
              />
              Active
            </label>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Move slide up"
                disabled={pending || index === 0}
                onClick={() => run(() => moveHeroSlide(slide.id, "up"), "Order updated.")}
                className="grid h-9 w-9 place-items-center rounded-control border border-border hover:bg-muted disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Move slide down"
                disabled={pending || index === slides.length - 1}
                onClick={() => run(() => moveHeroSlide(slide.id, "down"), "Order updated.")}
                className="grid h-9 w-9 place-items-center rounded-control border border-border hover:bg-muted disabled:opacity-40"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Delete slide"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Delete this hero slide?")) return;
                  run(() => deleteHeroSlide(slide.id), "Slide deleted.");
                }}
                className="grid h-9 w-9 place-items-center rounded-control border border-border text-danger hover:bg-danger/10 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}

        {slides.length === 0 && (
          <li className="rounded-card border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No hero slides yet. Add one below and it appears on the homepage
            immediately.
          </li>
        )}
      </ul>

      <div className="rounded-card border border-border bg-background p-4">
        <h3 className="mb-3 text-sm font-semibold">Add a slide</h3>
        <div className="flex flex-wrap items-end gap-4">
          <ImageUpload
            label="Shoe cut-out"
            value={draft.imageUrl}
            onChange={(url) => setDraft((d) => ({ ...d, imageUrl: url }))}
          />

          <div className="min-w-[12rem] flex-1">
            <label className="mb-1 block text-sm font-medium">Links to product</label>
            <select
              className={input}
              value={draft.productId}
              onChange={(e) => setDraft((d) => ({ ...d, productId: e.target.value }))}
            >
              <option value="">Shop page</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-32">
            <label className="mb-1 block text-sm font-medium">Hold (ms)</label>
            <input
              type="number"
              min={600}
              max={20000}
              step={100}
              className={input}
              value={draft.durationMs}
              onChange={(e) =>
                setDraft((d) => ({ ...d, durationMs: Number(e.target.value) }))
              }
            />
          </div>

          <button
            type="button"
            disabled={pending || !draft.imageUrl}
            onClick={() =>
              run(async () => {
                const result = await createHeroSlide(draft);
                if (result.ok) {
                  setDraft({ imageUrl: "", productId: "", durationMs: 1000, isActive: true });
                }
                return result;
              }, "Slide added.")
            }
            className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add slide
          </button>
        </div>
      </div>

      {message && (
        <p
          role="status"
          className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
