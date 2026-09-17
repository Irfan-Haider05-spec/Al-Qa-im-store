"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const GENDERS = ["men", "women", "unisex", "kids"];

export function ShopFilters({
  categories,
}: {
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      next.delete("page"); // reset paging on any filter change
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  const current = (k: string) => params.get(k) ?? "";

  return (
    <aside className="space-y-8">
      {/* Category */}
      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">Category</h3>
        <ul className="space-y-1.5">
          <li>
            <button
              onClick={() => setParam("category", null)}
              className={`text-sm ${
                !current("category")
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                onClick={() => setParam("category", c.slug)}
                className={`text-sm ${
                  current("category") === c.slug
                    ? "font-semibold text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Gender */}
      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">Gender</h3>
        <ul className="space-y-1.5">
          {GENDERS.map((g) => (
            <li key={g}>
              <button
                onClick={() =>
                  setParam("gender", current("gender") === g ? null : g)
                }
                className={`text-sm capitalize ${
                  current("gender") === g
                    ? "font-semibold text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {g}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">Price</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={current("minPrice")}
            onBlur={(e) => setParam("minPrice", e.target.value || null)}
            className="w-full rounded-control border border-border px-3 py-2 text-sm"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={current("maxPrice")}
            onBlur={(e) => setParam("maxPrice", e.target.value || null)}
            className="w-full rounded-control border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Sale */}
      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={current("onSale") === "1"}
            onChange={(e) => setParam("onSale", e.target.checked ? "1" : null)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          On sale only
        </label>
      </div>

      <button
        onClick={() => router.push(pathname)}
        className="text-sm text-muted-foreground underline hover:text-foreground"
      >
        Clear all filters
      </button>
    </aside>
  );
}
