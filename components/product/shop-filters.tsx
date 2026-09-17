"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const GENDERS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
  { value: "kids", label: "Kids" },
];

export type Facets = {
  brands: { slug: string; name: string }[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  minPrice: number;
  maxPrice: number;
};

/**
 * The shop's filter rail.
 *
 * Every control writes to the query string and lets the server re-run the
 * query — filtering is never faked on the client, so a filtered URL is
 * shareable, crawlable and correct on a hard refresh. The facet values
 * themselves come from the catalogue, so a new colour or size shows up here
 * without a code change.
 */
export function ShopFilters({
  categories,
  facets,
  resultCount,
}: {
  categories: { slug: string; name: string }[];
  facets: Facets;
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const current = useCallback((key: string) => params.get(key) ?? "", [params]);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      next.delete("page"); // any filter change starts again at page one
      const query = next.toString();
      startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
    },
    [params, pathname, router]
  );

  const toggleParam = (key: string, value: string) =>
    setParam(key, current(key) === value ? null : value);

  // A filter chosen in the mobile drawer should show its result, so close it.
  useEffect(() => {
    if (!pending) setDrawerOpen(false);
  }, [pending, params]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const activeCount = [
    "category",
    "brand",
    "gender",
    "size",
    "color",
    "minPrice",
    "maxPrice",
    "minRating",
    "onSale",
    "inStock",
  ].filter((k) => params.get(k)).length;

  const panel = (
    <div className="space-y-8">
      <FilterGroup title="Category">
        <OptionList
          options={[
            { value: "", label: "All categories" },
            ...categories.map((c) => ({ value: c.slug, label: c.name })),
          ]}
          value={current("category")}
          onSelect={(v) => setParam("category", v || null)}
        />
      </FilterGroup>

      {facets.brands.length > 1 && (
        <FilterGroup title="Brand">
          <OptionList
            options={[
              { value: "", label: "All brands" },
              ...facets.brands.map((b) => ({ value: b.slug, label: b.name })),
            ]}
            value={current("brand")}
            onSelect={(v) => setParam("brand", v || null)}
          />
        </FilterGroup>
      )}

      <FilterGroup title="Gender">
        <OptionList
          options={[{ value: "", label: "Everyone" }, ...GENDERS]}
          value={current("gender")}
          onSelect={(v) => setParam("gender", v || null)}
        />
      </FilterGroup>

      {facets.sizes.length > 0 && (
        <FilterGroup title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleParam("size", size)}
                aria-pressed={current("size") === size}
                className={cn(
                  "h-9 min-w-[2.5rem] rounded-control border px-2.5 text-sm transition-colors",
                  current("size") === size
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      {facets.colors.length > 0 && (
        <FilterGroup title="Colour">
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => toggleParam("color", color.name)}
                title={color.name}
                aria-label={color.name}
                aria-pressed={current("color") === color.name}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full border-2 transition-colors",
                  current("color") === color.name
                    ? "border-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span
                  className="h-5 w-5 rounded-full border border-black/5"
                  style={{ backgroundColor: color.hex }}
                />
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Price">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="minPrice">
            Minimum price
          </label>
          <input
            id="minPrice"
            type="number"
            inputMode="numeric"
            min={facets.minPrice}
            max={facets.maxPrice}
            placeholder={`$${facets.minPrice}`}
            defaultValue={current("minPrice")}
            onBlur={(e) => setParam("minPrice", e.target.value || null)}
            className="w-full rounded-control border border-border px-3 py-2 text-sm"
          />
          <span className="text-muted-foreground" aria-hidden>
            –
          </span>
          <label className="sr-only" htmlFor="maxPrice">
            Maximum price
          </label>
          <input
            id="maxPrice"
            type="number"
            inputMode="numeric"
            min={facets.minPrice}
            max={facets.maxPrice}
            placeholder={`$${facets.maxPrice}`}
            defaultValue={current("maxPrice")}
            onBlur={(e) => setParam("maxPrice", e.target.value || null)}
            className="w-full rounded-control border border-border px-3 py-2 text-sm"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Rating">
        <OptionList
          options={[
            { value: "", label: "Any rating" },
            { value: "4", label: "4 stars & up" },
            { value: "3", label: "3 stars & up" },
          ]}
          value={current("minRating")}
          onSelect={(v) => setParam("minRating", v || null)}
        />
      </FilterGroup>

      <FilterGroup title="Availability">
        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={current("inStock") === "1"}
              onChange={(e) => setParam("inStock", e.target.checked ? "1" : null)}
              className="h-4 w-4 accent-primary"
            />
            In stock only
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={current("onSale") === "1"}
              onChange={(e) => setParam("onSale", e.target.checked ? "1" : null)}
              className="h-4 w-4 accent-primary"
            />
            On sale only
          </label>
        </div>
      </FilterGroup>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => startTransition(() => router.push(pathname))}
          className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-pill border border-border text-sm font-medium transition-colors hover:border-primary"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters
          {activeCount > 0 && (
            <span className="rounded-pill bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop rail */}
      <aside aria-label="Product filters" className="hidden lg:block">
        <div className="sticky top-24">
          <div className="mb-6 flex items-center gap-2">
            <h2 className="font-display text-lg font-bold uppercase">Filters</h2>
            {pending && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Updating results" />
            )}
          </div>
          {panel}
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-secondary/50 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Product filters"
            className="absolute inset-y-0 left-0 flex w-[22rem] max-w-[88%] flex-col bg-background shadow-hover"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-lg font-bold uppercase">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">{panel}</div>

            <div className="border-t border-border p-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="h-12 w-full rounded-pill bg-primary text-sm font-medium text-primary-foreground"
              >
                Show {resultCount} {resultCount === 1 ? "result" : "results"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-3 font-display text-base font-semibold uppercase tracking-wide">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function OptionList({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <ul className="space-y-1.5">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <li key={option.value || "all"}>
            <button
              type="button"
              onClick={() => onSelect(option.value)}
              aria-pressed={active}
              className={cn(
                "text-sm transition-colors",
                active
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
