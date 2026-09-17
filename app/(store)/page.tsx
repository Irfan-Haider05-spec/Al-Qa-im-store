import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import {
  getHomepageContent,
  getPopularProducts,
  type ProductCardData,
} from "@/lib/products/queries";
import { getWishlistProductIds } from "@/lib/account/wishlist-actions";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetail } from "@/components/product/product-detail";
import { Hero } from "@/components/store/hero";
import { FadeIn, Stagger, StaggerItem } from "@/components/animations/fade-in";
import { PromoBand } from "@/components/store/promo-band";
import { NewArrivalsRail } from "@/components/store/new-arrivals-rail";
import { PopularPills } from "@/components/store/popular-pills";
import { effectivePrice, ratingSummary } from "@/lib/products/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.sEOSettings
    .findUnique({ where: { pageKey: "home" } })
    .catch(() => null);

  return {
    // `absolute` bypasses the root layout's "%s · Shoe Express" template —
    // otherwise the homepage title ends with the brand name twice.
    title: {
      absolute: seo?.title ?? "Shoe Express — Premium footwear for every step",
    },
    description:
      seo?.description ??
      "Sneakers, performance runners, leather Oxfords and waterproof boots. Free delivery over $100.",
    alternates: { canonical: "/" },
    openGraph: {
      title: seo?.title ?? "Shoe Express",
      description: seo?.description ?? undefined,
      type: "website",
      images: seo?.ogImageUrl ? [seo.ogImageUrl] : [],
    },
  };
}

const PROMISES = [
  { Icon: Truck, title: "Free delivery over $100", body: "Dispatched within 24 hours, tracked all the way." },
  { Icon: RotateCcw, title: "30-day returns", body: "Wear them indoors. If they're not right, send them back." },
  { Icon: ShieldCheck, title: "Two-year guarantee", body: "Against manufacturing faults, no receipt gymnastics." },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ popular?: string }>;
}) {
  const { popular } = await searchParams;
  const { homepage, categories, newArrivals, weeklyPick, banner } =
    await getHomepageContent();

  const [popularProducts, saved] = await Promise.all([
    getPopularProducts(popular ?? null, 4),
    getWishlistProductIds(),
  ]);

  const heroSlides = (homepage?.slides ?? []).map((slide, i) => ({
    imageUrl: slide.imageUrl,
    alt: `${homepage?.heroHeading ?? "Shoe Express"} — featured shoe ${i + 1}`,
    href: "/shop",
    label: null,
    durationMs: slide.durationMs,
  }));

  const pills = [
    { slug: null, label: "All" },
    ...categories.map((c) => ({ slug: c.slug, label: c.name })),
    { slug: "sale", label: "Sale" },
  ];

  // Organization + site-search structured data for the homepage.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Shoe Express",
        url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        logo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/icon.svg`,
      },
      {
        "@type": "WebSite",
        name: "Shoe Express",
        url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/shop?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero
        content={{
          heading: homepage?.heroHeading ?? "Sports Shoes",
          subheading: homepage?.heroSubheading ?? "Men's collection",
          description:
            homepage?.heroDescription ??
            "Find your true stride with Shoe Express.",
          ctaLabel: homepage?.heroCtaLabel ?? "Shop Now",
          ctaUrl: homepage?.heroCtaUrl ?? "/shop",
        }}
        slides={heroSlides}
      />

      {/* -------------------------------------------------------- promises -- */}
      <section aria-label="Why shop with us" className="border-y border-border bg-muted/60">
        <Stagger className="mx-auto grid max-w-content gap-6 px-5 py-8 sm:grid-cols-3 sm:px-8">
          {PROMISES.map(({ Icon, title, body }) => (
            <StaggerItem key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ----------------------------------------------------------- promo -- */}
      {banner && <PromoBand banner={banner} />}

      {/* --------------------------------------------- popular right now -- */}
      <section id="popular" className="mx-auto max-w-content scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20">
        <FadeIn className="text-center">
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
            Popular right now
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            What people are actually buying this week, updated as orders come in.
          </p>
          <div className="mt-7">
            <PopularPills pills={pills} />
          </div>
        </FadeIn>

        {popularProducts.length > 0 ? (
          <Stagger className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {popularProducts.map((product: ProductCardData) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} saved={saved.has(product.id)} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <p className="mt-10 rounded-card border border-dashed border-border py-12 text-center text-muted-foreground">
            Nothing in this category yet — try another filter.
          </p>
        )}
      </section>

      {/* ---------------------------------------------------- new arrivals -- */}
      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-content px-5 pb-16 sm:px-8 sm:pb-20">
          <FadeIn className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                New arrival
              </h2>
              <p className="mt-2 text-muted-foreground">
                The latest drops, straight off the shelf.
              </p>
            </div>
            <Link
              href="/shop?sort=newest"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              View all
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </FadeIn>

          <NewArrivalsRail products={newArrivals} />
        </section>
      )}

      {/* ------------------------------------------------------ categories -- */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-content px-5 pb-16 sm:px-8 sm:pb-20">
          <FadeIn>
            <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              Shop by category
            </h2>
          </FadeIn>

          <Stagger className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <StaggerItem key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-card bg-muted"
                >
                  {category.imageUrl && (
                    <Image
                      src={category.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 19vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent"
                  />
                  <span className="absolute inset-x-0 bottom-0 p-4 font-display text-lg font-bold text-white">
                    {category.name}
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {/* ----------------------------------------------------- weekly pick -- */}
      {weeklyPick && (
        <section className="border-y border-border bg-muted/50">
          <div className="mx-auto max-w-content px-5 py-16 sm:px-8 sm:py-20">
            <FadeIn className="mb-9 text-center">
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                {homepage?.weeklyPickHeading ?? "Our weekly pick"}
              </h2>
              {homepage?.weeklyPickDesc && (
                <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                  {homepage.weeklyPickDesc}
                </p>
              )}
            </FadeIn>

            <FadeIn>
              <ProductDetail
                images={weeklyPick.images.map((i) => ({
                  url: i.url,
                  alt: i.alt,
                  colorId: i.colorId,
                }))}
                panel={{
                  productId: weeklyPick.id,
                  productName: weeklyPick.name,
                  basePrice: effectivePrice(weeklyPick).base,
                  salePrice: effectivePrice(weeklyPick).sale,
                  colors: weeklyPick.colors.map((c) => ({
                    id: c.id,
                    name: c.name,
                    hex: c.hex,
                  })),
                  sizes: weeklyPick.sizes.map((s) => ({ id: s.id, label: s.label })),
                  variants: weeklyPick.variants.map((v) => ({
                    id: v.id,
                    colorId: v.colorId,
                    sizeId: v.sizeId,
                    inventory: v.inventory
                      ? { available: v.inventory.available }
                      : null,
                  })),
                  rating: ratingSummary(weeklyPick.reviews),
                  savedToWishlist: saved.has(weeklyPick.id),
                  compact: true,
                }}
              />

              <p className="mt-6 text-center">
                <Link
                  href={`/products/${weeklyPick.slug}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  See full details for {weeklyPick.name}
                </Link>
              </p>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------ membership -- */}
      <section className="bg-primary py-20 text-center text-primary-foreground">
        <FadeIn className="mx-auto max-w-content px-5 sm:px-8">
          <h2 className="font-display text-3xl font-bold uppercase sm:text-4xl">
            {homepage?.membershipHeading ?? "Become a member and get 20% off"}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-primary-foreground/85">
            Early access to drops, members-only sizes and a discount on your first order.
          </p>
          <Link
            href={homepage?.membershipCtaUrl ?? "/register"}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-pill bg-background px-8 text-sm font-medium text-foreground transition-transform hover:-translate-y-0.5"
          >
            {homepage?.membershipCtaLabel ?? "Sign up for free now"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </FadeIn>
      </section>
    </>
  );
}
