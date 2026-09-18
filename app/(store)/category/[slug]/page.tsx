import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getCategoryTree, getProducts, type SortKey } from "@/lib/products/queries";
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

  const category = await prisma.category.findUnique({
    where: { slug },
    include: { parent: { select: { slug: true, name: true } } },
  });
  if (!category || !category.isActive) notFound();

  const requestedSort = str(sp.sort) as SortKey | undefined;
  const page = Math.max(1, Number(str(sp.page) ?? 1) || 1);
  const perPage = 12;

  const [{ products, total, totalPages }, settings, saved, tree] = await Promise.all([
    getProducts({
      category: slug,
      sort: requestedSort && SORT_KEYS.includes(requestedSort) ? requestedSort : "featured",
      page,
      perPage,
    }),
    getSiteSettings(),
    getWishlistProductIds(),
    getCategoryTree(),
  ]);

  // A department lists the categories inside it; a category lists its
  // siblings, so shoppers can move sideways without going back to the shop.
  const department = tree.find(
    (d) => d.slug === slug || d.children.some((c) => c.slug === slug)
  );
  const related = department?.children ?? [];

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
      <header className="surface-dark relative isolate overflow-hidden pt-36 sm:pt-40">
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

        <div className="mx-auto max-w-content px-5 pb-16 sm:px-8 lg:px-12">
          <nav aria-label="Breadcrumb" className="eyebrow mb-5 text-[0.66rem] text-ivory/60">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <Link href="/shop" className="transition-colors hover:text-white">
              Shop
            </Link>
            {category.parent && (
              <>
                <span className="mx-1.5">/</span>
                <Link
                  href={`/category/${category.parent.slug}`}
                  className="transition-colors hover:text-white"
                >
                  {category.parent.name}
                </Link>
              </>
            )}
            <span className="mx-1.5">/</span>
            <span className="text-white">{category.name}</span>
          </nav>

          <h1 className="font-display text-[clamp(2.6rem,6vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ivory">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-5 max-w-2xl leading-relaxed text-ivory/70">{category.description}</p>
          )}

          {department && related.length > 0 && (
            <nav aria-label={`${department.name} categories`} className="mt-8 flex flex-wrap gap-2">
              <CategoryLink href={`/category/${department.slug}`} active={department.slug === slug}>
                All {department.name}
              </CategoryLink>
              {related.map((c) => (
                <CategoryLink key={c.slug} href={`/category/${c.slug}`} active={c.slug === slug}>
                  {c.name}
                </CategoryLink>
              ))}
            </nav>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-content px-5 pt-12 sm:px-8 lg:px-12">
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

function CategoryLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex h-9 items-center rounded-pill bg-gold-gradient px-4 text-[0.8rem] font-semibold text-ink"
          : "inline-flex h-9 items-center rounded-pill border border-white/20 px-4 text-[0.8rem] text-ivory/80 transition-colors hover:border-gold-light hover:text-ivory"
      }
    >
      {children}
    </Link>
  );
}
