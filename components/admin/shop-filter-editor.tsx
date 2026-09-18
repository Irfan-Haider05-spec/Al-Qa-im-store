"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import { saveShopFilters } from "@/lib/admin/shop-filter-actions";
import { FILTER_GROUPS, type FilterSetting } from "@/lib/catalog/shop-filters";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

const MANAGE: Partial<Record<FilterSetting["key"], { href: string; label: string }>> = {
  category: { href: "/admin/categories", label: "Manage categories" },
  brand: { href: "/admin/brands", label: "Manage brands" },
};

export function ShopFilterEditor({ initial }: { initial: FilterSetting[] }) {
  const [filters, setFilters] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const dirty = JSON.stringify(filters) !== JSON.stringify(initial);

  const move = (index: number, delta: -1 | 1) =>
    setFilters((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const toggle = (index: number) =>
    setFilters((list) => list.map((f, i) => (i === index ? { ...f, enabled: !f.enabled } : f)));

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await saveShopFilters(filters);
      if (res.ok) toast("Shop filters saved.");
      else setError(res.error);
    });
  }

  return (
    <div className="max-w-3xl space-y-5">
      <ol className="divide-y divide-border overflow-hidden rounded-card border border-border bg-background">
        {filters.map((f, i) => {
          const group = FILTER_GROUPS[f.key];
          const manage = MANAGE[f.key];
          return (
            <li key={f.key} className={cn("flex items-center gap-4 px-4 py-3.5", !f.enabled && "bg-muted/30")}>
              <label className="flex flex-1 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={f.enabled}
                  onChange={() => toggle(i)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  <span className={cn("block font-medium", !f.enabled && "text-muted-foreground")}>
                    {group.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">{group.hint}</span>
                </span>
              </label>

              {manage && (
                <Link
                  href={manage.href}
                  className="hidden items-center gap-1 text-xs font-medium text-gold-ink hover:underline sm:inline-flex"
                >
                  {manage.label}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
              )}

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${group.label} up`}
                  className="grid h-8 w-8 place-items-center rounded-control border border-border hover:bg-muted disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === filters.length - 1}
                  aria-label={`Move ${group.label} down`}
                  className="grid h-8 w-8 place-items-center rounded-control border border-border hover:bg-muted disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="inline-flex h-11 items-center rounded-pill bg-primary px-7 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save filters"}
        </button>
        <Link
          href="/shop"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          See the shop
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
