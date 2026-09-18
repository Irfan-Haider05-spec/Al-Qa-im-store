"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export type Pill = { slug: string | null; label: string };

/**
 * The "Popular right now" filter row.
 *
 * Each pill is a real link that sets `?popular=<slug>`, so the server re-queries
 * the catalogue, the choice survives a refresh and the URL can be shared. They
 * are anchors rather than buttons for the same reason — middle-click and
 * "open in new tab" behave as expected.
 */
export function PopularPills({ pills }: { pills: Pill[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("popular");

  const hrefFor = (slug: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (slug) next.set("popular", slug);
    else next.delete("popular");
    const query = next.toString();
    return `${pathname}${query ? `?${query}` : ""}#popular`;
  };

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {pills.map((pill) => {
        const active = (pill.slug ?? null) === (current ?? null);
        return (
          <Link
            key={pill.label}
            href={hrefFor(pill.slug)}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-pill border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
              active
                ? "border-ink bg-ink text-ivory"
                : "border-border text-foreground hover:border-gold-ink hover:text-gold-ink"
            )}
          >
            {pill.label}
          </Link>
        );
      })}
    </div>
  );
}
