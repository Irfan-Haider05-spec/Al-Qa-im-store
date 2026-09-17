"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/lib/admin/product-actions";
import type { ProductFormInput } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils/format";

type Option = { id: string; name: string };

const GENDERS = ["MEN", "WOMEN", "UNISEX", "KIDS"] as const;

export function ProductForm({
  productId,
  initial,
  categories,
  brands,
}: {
  productId?: string;
  initial?: Partial<ProductFormInput>;
  categories: Option[];
  brands: Option[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormInput>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    shortDesc: initial?.shortDesc ?? "",
    description: initial?.description ?? "",
    gender: initial?.gender ?? "UNISEX",
    basePrice: initial?.basePrice ?? 0,
    salePrice: initial?.salePrice ?? null,
    sku: initial?.sku ?? "",
    categoryId: initial?.categoryId ?? "",
    brandId: initial?.brandId ?? "",
    tags: initial?.tags ?? "",
    isPublished: initial?.isPublished ?? false,
    isFeatured: initial?.isFeatured ?? false,
    isNewArrival: initial?.isNewArrival ?? false,
    isWeeklyPick: initial?.isWeeklyPick ?? false,
    isOnSale: initial?.isOnSale ?? false,
    seoTitle: initial?.seoTitle ?? "",
    seoDesc: initial?.seoDesc ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof ProductFormInput>(
    k: K,
    v: ProductFormInput[K]
  ) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = productId
        ? await updateProduct(productId, form)
        : await createProduct(form);
      if (res.ok) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const input =
    "w-full rounded-control border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none";
  const label = "mb-1 block text-sm font-medium";

  const FLAGS: [keyof ProductFormInput, string][] = [
    ["isPublished", "Published"],
    ["isFeatured", "Featured"],
    ["isNewArrival", "New Arrival"],
    ["isWeeklyPick", "Weekly Pick"],
    ["isOnSale", "On Sale"],
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>Name</label>
          <input
            className={input}
            value={form.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!productId) set("slug", slugify(e.target.value));
            }}
          />
        </div>
        <div>
          <label className={label}>Slug</label>
          <input
            className={input}
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
          />
        </div>
        <div>
          <label className={label}>SKU</label>
          <input
            className={input}
            value={form.sku ?? ""}
            onChange={(e) => set("sku", e.target.value)}
          />
        </div>
        <div>
          <label className={label}>Base price</label>
          <input
            type="number"
            step="0.01"
            className={input}
            value={form.basePrice}
            onChange={(e) => set("basePrice", Number(e.target.value))}
          />
        </div>
        <div>
          <label className={label}>Sale price (optional)</label>
          <input
            type="number"
            step="0.01"
            className={input}
            value={form.salePrice ?? ""}
            onChange={(e) =>
              set("salePrice", e.target.value ? Number(e.target.value) : null)
            }
          />
        </div>
        <div>
          <label className={label}>Gender</label>
          <select
            className={input}
            value={form.gender}
            onChange={(e) =>
              set("gender", e.target.value as ProductFormInput["gender"])
            }
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Category</label>
          <select
            className={input}
            value={form.categoryId ?? ""}
            onChange={(e) => set("categoryId", e.target.value)}
          >
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Brand</label>
          <select
            className={input}
            value={form.brandId ?? ""}
            onChange={(e) => set("brandId", e.target.value)}
          >
            <option value="">— none —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Tags (comma-separated)</label>
          <input
            className={input}
            value={form.tags ?? ""}
            onChange={(e) => set("tags", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Short description</label>
          <input
            className={input}
            value={form.shortDesc ?? ""}
            onChange={(e) => set("shortDesc", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Description</label>
          <textarea
            rows={4}
            className={input}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </div>

      {/* flags */}
      <div className="flex flex-wrap gap-4">
        {FLAGS.map(([key, lbl]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form[key])}
              onChange={(e) => set(key, e.target.checked as never)}
              className="h-4 w-4 accent-primary"
            />
            {lbl}
          </label>
        ))}
      </div>

      {/* SEO */}
      <div className="grid gap-4 rounded-card border border-border p-4 sm:grid-cols-2">
        <div className="sm:col-span-2 text-sm font-medium">SEO</div>
        <div>
          <label className={label}>SEO title</label>
          <input
            className={input}
            value={form.seoTitle ?? ""}
            onChange={(e) => set("seoTitle", e.target.value)}
          />
        </div>
        <div>
          <label className={label}>SEO description</label>
          <input
            className={input}
            value={form.seoDesc ?? ""}
            onChange={(e) => set("seoDesc", e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={pending}
          className="inline-flex h-11 items-center rounded-pill bg-primary px-8 font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
        >
          {pending ? "Saving…" : productId ? "Save changes" : "Create product"}
        </button>
        <button
          onClick={() => router.push("/admin/products")}
          className="inline-flex h-11 items-center rounded-pill border border-border px-6 text-sm hover:bg-muted"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Variants, inventory and images are managed on the Inventory page and the
        image manager (Phase 5 part 2).
      </p>
    </div>
  );
}
