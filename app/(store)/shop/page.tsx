import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import {
  getProducts,
  getCategoryTree,
  getFilterFacets,
  type SortKey,
} from "@/lib/products/queries";
import { enabledFilterKeys } from "@/lib/catalog/shop-filters";
import { getSiteSettings } from "@/lib/settings/site";
import { getWishlistProductIds } from "@/lib/account/wishlist-actions";
import { ProductCard } from "@/components/product/product-card";
import { ShopFilters } from "@/components/product/shop-filters";
import { SortSelect } from "@/components/product/sort-select";
import { CategoryChips } from "@/components/product/category-chips";
import { Pagination } from "@/components/ui/pagination";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = str(sp.q);
  const seo = await prisma.sEOSettings
    .findUnique({ where: { pageKey: "shop" } })
    .catch(() => null);

  return {
    title: q ? `Search: ${q}` : (seo?.title ?? "Shop"),
    description:
      seo?.description ?? "Browse the full Al-Qa’im collection.",
    // A filtered or searched listing is the same catalogue sliced differently,
    // so it points back at the clean /shop URL instead of competing with it.
    alternates: { canonical: "/shop" },
    robots: q ? { index: false, follow: true } : undefined,
  };
}

type SearchParams = { [k: string]: string | string[] | undefined };

function str(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | string[] | undefined) {
  const raw = str(v);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const SORT_KEYS: SortKey[] = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
  "rating",
];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const requestedSort = str(sp.sort) as SortKey | undefined;

  const filters = {
    q: str(sp.q),
    category: str(sp.category),
    brand: str(sp.brand),
    gender: str(sp.gender),
    size: str(sp.size),
    color: str(sp.color),
    onSale: str(sp.onSale) === "1",
    inStock: str(sp.inStock) === "1",
    minRating: num(sp.minRating),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    // Never hand an unvalidated string to the order-by lookup.
    sort: requestedSort && SORT_KEYS.includes(requestedSort) ? requestedSort : "featured",
    page: Math.max(1, num(sp.page) ?? 1),
    perPage: 12,
  };

  const [{ products, total, page, totalPages }, tree, facets, settings, saved] =
    await Promise.all([
      getProducts(filters),
      getCategoryTree(),
      getFilterFacets({ category: filters.category }),
      getSiteSettings(),
      getWishlistProductIds(),
    ]);

  // Where we are in the tree, for the heading and breadcrumb.
  const department = filters.category
    ? tree.find(
        (d) => d.slug === filters.category || d.children.some((c) => c.slug === filters.category)
      )
    : undefined;
  const category =
    department?.slug === filters.category
      ? department
      : department?.children.find((c) => c.slug === filters.category);

  const heading = filters.q ? `Results for “${filters.q}”` : (category?.name ?? "Shop");
  const filterGroups = enabledFilterKeys(settings.shopFilters);

  const makeHref = (target: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      const single = str(value);
      if (single) next.set(key, single);
    }
    next.set("page", String(target));
    return `/shop?${next.toString()}`;
  };

  const from = total === 0 ? 0 : (page - 1) * filters.perPage + 1;
  const to = Math.min(page * filters.perPage, total);

  return (
    <div className="mx-auto max-w-content px-5 pb-20 pt-[7.5rem] sm:px-8 lg:px-12">
      {/* Compact header: where you are, what's here and how it's sorted, on
          one line — the products start within the first screen. */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border pb-5">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <Link href="/shop" className="hover:text-foreground">
              Shop
            </Link>
            {department && (
              <>
                <span className="mx-1.5">/</span>
                <Link href={`/shop?category=${department.slug}`} className="hover:text-foreground">
                  {department.name}
                </Link>
              </>
            )}
            {category && category !== department && (
              <>
                <span className="mx-1.5">/</span>
                <span className="text-foreground">{category.name}</span>
              </>
            )}
          </nav>
          <h1 className="font-display text-[clamp(1.9rem,3.4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.02em]">
            {heading}
          </h1>
        </div>

        <div className="flex items-center gap-5">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {total === 0
              ? "No products"
              : total <= filters.perPage
                ? `${total} ${total === 1 ? "product" : "products"}`
                : `${from}–${to} of ${total} products`}
          </p>
          <SortSelect />
        </div>
      </header>

      {!filters.q && tree.length > 1 && (
        <div className="mt-5">
          <CategoryChips tree={tree} current={filters.category} sort={filters.sort} />
        </div>
      )}

      <div className="mt-7 grid gap-6 lg:grid-cols-[228px_1fr] lg:gap-10">
        <ShopFilters
          categories={tree.map((d) => ({
            slug: d.slug,
            name: d.name,
            children: d.children.map((c) => ({ slug: c.slug, name: c.name })),
          }))}
          groups={filterGroups}
          facets={facets}
          resultCount={total}
          currency={settings.currency}
        />

        <div>

          {products.length === 0 ? (
            <div className="rounded-card border border-dashed border-border p-16 text-center">
              <p className="font-medium">No products match these filters.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try clearing a filter, widening the price range, or searching for
                something else.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={settings.currency}
                  saved={saved.has(product.id)}
                  priority={i < 3}
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} makeHref={makeHref} />
        </div>
      </div>
    </div>
  );
}
