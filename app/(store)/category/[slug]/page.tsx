import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getProducts, type SortKey } from "@/lib/products/queries";
import { getSiteSettings } from "@/lib/settings/site";
import { getWishlistProductIds } from "@/lib/account/wishlist-actions";
import { ProductCard } from "@/components/product/product-card";
import { SortSelect } from "@/components/product/sort-select";
import { Pagination } from "@/components/ui/pagination";

type Params = { slug: string };
type SearchParams = { [k: string]: string | string[] | undefined };

const SORT_KEYS: SortKey[] = ["featured", "newest", "price-asc", "price-desc", "rating"];

function str(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/** Pre-render every active category at build time. */
export async function generateStaticParams() {
  const categories = await prisma.category
    .findMany({ where: { isActive: true }, select: { slug: true } })
    .catch(() => []);
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Category not found" };

  const title = category.seoTitle ?? category.name;
  const description = category.seoDesc ?? category.description ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: category.imageUrl ? [category.imageUrl] : [],
    },
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

  const requestedSort = str(sp.sort) as SortKey | undefined;
  const page = Math.max(1, Number(str(sp.page) ?? 1) || 1);
  const perPage = 12;

  const [{ products, total, totalPages }, settings, saved] = await Promise.all([
    getProducts({
      category: slug,
      sort: requestedSort && SORT_KEYS.includes(requestedSort) ? requestedSort : "featured",
      page,
      perPage,
    }),
    getSiteSettings(),
    getWishlistProductIds(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: category.name,
        description: category.description ?? undefined,
        url: `${siteUrl}/category/${slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop` },
          { "@type": "ListItem", position: 3, name: category.name },
        ],
      },
    ],
  };

  const makeHref = (target: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      const single = str(value);
      if (single) next.set(key, single);
    }
    next.set("page", String(target));
    return `/category/${slug}?${next.toString()}`;
  };

  return (
    <div className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Category banner — the photograph set in Admin → Categories. */}
      <header className="relative isolate overflow-hidden bg-secondary pt-28 text-white sm:pt-32">
        {category.imageUrl && (
          <>
            <Image
              src={category.imageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="-z-10 object-cover opacity-45"
            />
            <span aria-hidden className="absolute inset-0 -z-10 bg-secondary/55" />
          </>
        )}

        <div className="mx-auto max-w-content px-5 pb-14 sm:px-8">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-white/75">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <Link href="/shop" className="transition-colors hover:text-white">
              Shop
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-white">{category.name}</span>
          </nav>

          <h1 className="font-display text-4xl font-bold uppercase sm:text-6xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-4 max-w-2xl text-white/85">{category.description}</p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-content px-5 pt-10 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"}
          </p>
          <SortSelect />
        </div>

        {products.length === 0 ? (
          <div className="rounded-card border border-dashed border-border p-16 text-center">
            <p className="font-medium">Nothing here yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back soon, or browse the full shop.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-flex h-10 items-center rounded-pill bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
            >
              Shop all
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {products.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={settings.currency}
                saved={saved.has(product.id)}
                priority={i < 4}
              />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} makeHref={makeHref} />
      </div>
    </div>
  );
}
