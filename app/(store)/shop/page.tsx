import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import {
  getProducts,
  getCategories,
  getFilterFacets,
  type SortKey,
} from "@/lib/products/queries";
import { getSiteSettings } from "@/lib/settings/site";
import { getWishlistProductIds } from "@/lib/account/wishlist-actions";
import { ProductCard } from "@/components/product/product-card";
import { ShopFilters } from "@/components/product/shop-filters";
import { SortSelect } from "@/components/product/sort-select";
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
      seo?.description ?? "Browse the full Shoe Express collection.",
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

  const [{ products, total, page, totalPages }, categories, facets, settings, saved] =
    await Promise.all([
      getProducts(filters),
      getCategories(),
      getFilterFacets(),
      getSiteSettings(),
      getWishlistProductIds(),
    ]);

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
    <div className="mx-auto max-w-content px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold uppercase sm:text-5xl">
          {filters.q ? `Results for “${filters.q}”` : "Shop"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {total === 0
            ? "No products found"
            : `${total} ${total === 1 ? "product" : "products"}`}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
        <ShopFilters
          categories={categories}
          facets={facets}
          resultCount={total}
        />

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {total === 0 ? "Nothing to show" : `Showing ${from}–${to} of ${total}`}
            </p>
            <SortSelect />
          </div>

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
