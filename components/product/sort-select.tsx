"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Best rated" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const onChange = (value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("sort", value);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Sort</span>
      <select
        value={params.get("sort") ?? "featured"}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-control border border-border bg-background px-3 py-2 text-sm"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
