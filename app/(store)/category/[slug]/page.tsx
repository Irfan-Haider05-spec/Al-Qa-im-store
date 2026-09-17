import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getProducts } from "@/lib/products/queries";
import { ProductCard, type CardProduct as CardRow } from "@/components/product/product-card";
import { SortSelect } from "@/components/product/sort-select";

type Params = { slug: string };
type SearchParams = { [k: string]: string | string[] | undefined };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Category not found" };
  return {
    title: category.seoTitle ?? category.name,
    description: category.seoDesc ?? category.description ?? undefined,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category || !category.isActive) notFound();

  const sort = (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort) as
    | undefined
    | "featured"
    | "newest"
    | "price-asc"
    | "price-desc"
    | "rating";

  const { products, total } = await getProducts({
    category: slug,
    sort: sort ?? "featured",
    perPage: 24,
  });

  return (
    <div className="mx-auto max-w-content px-5 pb-20 pt-28 sm:px-8">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {category.description}
          </p>
        )}
      </header>

      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {total} {total === 1 ? "product" : "products"}
        </span>
        <SortSelect />
      </div>

      {products.length === 0 ? (
        <div className="rounded-card border border-dashed border-border p-16 text-center">
          <p className="font-medium">Nothing here yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon or browse the full shop.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {products.map((p: CardRow) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
