"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Tag, Trash2 } from "lucide-react";
import { createBrand, deleteBrand, updateBrand } from "@/lib/admin/brand-actions";
import { ImageUpload } from "@/components/admin/image-upload";
import { slugify } from "@/lib/utils/format";
import type { BrandFormInput } from "@/lib/validations/admin";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  position: number;
  _count: { products: number };
};

const input =
  "w-full rounded-control border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

function toForm(b: Brand): BrandFormInput {
  return {
    name: b.name,
    slug: b.slug,
    logoUrl: b.logoUrl ?? "",
    isActive: b.isActive,
    position: b.position,
  };
}

/**
 * The brands products can carry, and the list the shop's Brand filter offers.
 * Hiding a brand removes it from the filter only; its products stay on sale.
 */
export function BrandManager({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<BrandFormInput | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) after?.();
      else setError(res.error ?? "Something went wrong.");
      router.refresh();
    });
  };

  const set = <K extends keyof BrandFormInput>(key: K, value: BrandFormInput[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-border bg-background p-4">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () =>
                createBrand({
                  name,
                  slug: slugify(name),
                  logoUrl: "",
                  isActive: true,
                  position: brands.length,
                }),
              () => setName("")
            );
          }}
        >
          <div className="min-w-[16rem]">
            <label htmlFor="new-brand" className="mb-1 block text-sm font-medium">
              New brand
            </label>
            <input
              id="new-brand"
              className={input}
              value={name}
              placeholder="e.g. Al-Qa’im Tailoring"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="inline-flex h-10 items-center rounded-pill bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
          >
            Add brand
          </button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Assign brands to products on each product&apos;s page. The shop&apos;s Brand filter lists
          visible brands that have published products in the section being browsed.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-card border border-border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">In shop filter</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No brands yet.
                </td>
              </tr>
            )}
            {brands.map((b) => (
              <Fragment key={b.id}>
                <tr className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-control bg-muted">
                        {b.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                          <img src={b.logoUrl} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <Tag className="h-4 w-4 text-muted-foreground" aria-hidden />
                        )}
                      </span>
                      <span className="font-medium">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{b.slug}</td>
                  <td className="px-4 py-3">{b._count.products}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.position}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => updateBrand(b.id, { ...toForm(b), isActive: !b.isActive }))}
                      className={`rounded-pill px-2.5 py-0.5 text-xs ${
                        b.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {b.isActive ? "Shown" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        aria-label={`Edit ${b.name}`}
                        aria-expanded={editing === b.id}
                        onClick={() => {
                          setError(null);
                          if (editing === b.id) {
                            setEditing(null);
                          } else {
                            setEditing(b.id);
                            setDraft(toForm(b));
                          }
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${b.name}`}
                        onClick={() => {
                          const note = b._count.products
                            ? ` Its ${b._count.products} product(s) will stay on sale without a brand.`
                            : "";
                          if (window.confirm(`Delete the brand "${b.name}"?${note}`)) {
                            run(() => deleteBrand(b.id));
                          }
                        }}
                        className="text-danger hover:opacity-70"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                {editing === b.id && draft && (
                  <tr className="border-b border-border bg-muted/30">
                    <td colSpan={6} className="px-4 py-5">
                      <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
                        <ImageUpload
                          label="Logo (optional)"
                          value={draft.logoUrl ?? ""}
                          onChange={(url) => set("logoUrl", url)}
                        />
                        <div className="grid max-w-xl gap-3 sm:grid-cols-[1fr_1fr_6rem]">
                          <div>
                            <label className="mb-1 block text-sm font-medium">Name</label>
                            <input
                              className={input}
                              value={draft.name}
                              onChange={(e) => set("name", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium">Slug</label>
                            <input
                              className={input}
                              value={draft.slug}
                              onChange={(e) => set("slug", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium">Order</label>
                            <input
                              type="number"
                              min={0}
                              className={input}
                              value={draft.position}
                              onChange={(e) => set("position", Number(e.target.value) || 0)}
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm sm:col-span-3">
                            <input
                              type="checkbox"
                              checked={draft.isActive}
                              onChange={(e) => set("isActive", e.target.checked)}
                            />
                            Show in the shop&apos;s Brand filter
                          </label>
                        </div>
                      </div>
                      <div className="mt-5 flex gap-3">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () => updateBrand(b.id, draft),
                              () => setEditing(null)
                            )
                          }
                          className="inline-flex h-10 items-center rounded-pill bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
                        >
                          {pending ? "Saving…" : "Save changes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="inline-flex h-10 items-center rounded-pill border border-border px-5 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
