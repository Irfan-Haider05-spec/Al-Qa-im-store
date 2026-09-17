import type { Metadata } from "next";
import { getProducts, getCategories, type SortKey } from "@/lib/products/queries";
import { ProductCard, type CardProduct as CardRow } from "@/components/product/product-card";
import { ShopFilters } from "@/components/product/shop-filters";
import { SortSelect } from "@/components/product/sort-select";
import { Pagination } from "@/components/ui/pagination";
import { ratingSummary } from "@/lib/products/pricing";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the full Shoe Express collection.",
};

type SearchParams = { [k: string]: string | string[] | undefined };

function str(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const filters = {
    q: str(sp.q),
    category: str(sp.category),
    gender: str(sp.gender),
    onSale: str(sp.onSale) === "1",
    minPrice: str(sp.minPrice) ? Number(str(sp.minPrice)) : undefined,
    maxPrice: str(sp.maxPrice) ? Number(str(sp.maxPrice)) : undefined,
    sort: (str(sp.sort) as SortKey) ?? "featured",
    page: str(sp.page) ? Number(str(sp.page)) : 1,
  };

  const [{ products, total, page, totalPages }, categories] =
    await Promise.all([getProducts(filters), getCategories()]);

  // "Best rated" refinement: sort in-memory by computed average when requested.
  const list =
    filters.sort === "rating"
      ? [...products].sort(
          (a, b) =>
            ratingSummary(b.reviews).average - ratingSummary(a.reviews).average
        )
      : products;

  const makeHref = (p: number) => {
    const next = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      const val = str(v);
      if (val) next.set(k, val);
    });
    next.set("page", String(p));
    return `/shop?${next.toString()}`;
  };

  return (
    <div className="mx-auto max-w-content px-5 pb-20 pt-28 sm:px-8">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold">Shop</h1>
        <p className="mt-1 text-muted-foreground">
          {total} {total === 1 ? "product" : "products"}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <ShopFilters categories={categories} />

        <div>
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {list.length} of {total}
            </span>
            <SortSelect />
          </div>

          {list.length === 0 ? (
            <div className="rounded-card border border-dashed border-border p-16 text-center">
              <p className="font-medium">No products match these filters.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try clearing a filter or widening your price range.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
              {list.map((p: CardRow) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} makeHref={makeHref} />
        </div>
      </div>
    </div>
  );
}
