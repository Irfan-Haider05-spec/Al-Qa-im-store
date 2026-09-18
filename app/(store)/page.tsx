import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Banknote, RotateCcw, ShieldCheck, Truck, Quote } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import {
  getHomepageContent,
  getPopularProducts,
  getHeroSlides,
  getFeaturedReviews,
  type ProductCardData,
} from "@/lib/products/queries";
import { getWishlistProductIds } from "@/lib/account/wishlist-actions";
import { getSiteSettings, describeShipping } from "@/lib/settings/site";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetail } from "@/components/product/product-detail";
import { Hero } from "@/components/store/hero/hero";
import { FadeIn, Stagger, StaggerItem } from "@/components/animations/fade-in";
import { PromoBand } from "@/components/store/promo-band";
import { NewArrivalsRail } from "@/components/store/new-arrivals-rail";
import { PopularPills } from "@/components/store/popular-pills";
import { SectionHeading } from "@/components/store/section-heading";
import { Rating } from "@/components/ui/rating";
import { effectivePrice, ratingSummary } from "@/lib/products/pricing";
import { BRAND } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.sEOSettings
    .findUnique({ where: { pageKey: "home" } })
    .catch(() => null);

  const title = seo?.title ?? `${BRAND.name} — ${BRAND.tagline}`;
  return {
    // `absolute` bypasses the "%s · Brand" template so the name isn't doubled.
    title: { absolute: title },
    description: seo?.description ?? BRAND.description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description: seo?.description ?? BRAND.description,
      type: "website",
      images: seo?.ogImageUrl ? [seo.ogImageUrl] : [],
    },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ popular?: string }>;
}) {
  const { popular } = await searchParams;

  const [
    { homepage, categories, departments, newArrivals, weeklyPick, banner },
    heroSlides,
    popularProducts,
    reviews,
    saved,
    settings,
  ] = await Promise.all([
    getHomepageContent(),
    getHeroSlides(),
    getPopularProducts(popular ?? null, 4),
    getFeaturedReviews(3),
    getWishlistProductIds(),
    getSiteSettings(),
  ]);

  const pills = [
    { slug: null, label: "All" },
    ...categories.map((c) => ({ slug: c.slug, label: c.name })),
    { slug: "sale", label: "Sale" },
  ];

  const promises = [
    {
      Icon: Truck,
      // The headline follows the real shipping settings, like the body does.
      title:
        settings.flatShipping === 0
          ? "Free delivery"
          : settings.freeShippingThreshold != null
            ? "Complimentary delivery"
            : "Tracked delivery",
      body: describeShipping(settings),
    },
    { Icon: RotateCcw, title: "30-day returns", body: "Try it at home. Unworn items come back free." },
    // Only promises the store actually keeps: COD is the live payment method,
    // and card details never reach our servers.
    { Icon: Banknote, title: "Cash on delivery", body: "Pay when your order arrives — no card needed." },
    { Icon: ShieldCheck, title: "Secure checkout", body: "Encrypted end to end. We never store card numbers." },
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: settings.storeName,
        url: siteUrl,
        logo: `${siteUrl}/brand/mark.svg`,
      },
      {
        "@type": "WebSite",
        name: settings.storeName,
        url: siteUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/shop?q={search_term_string}` },
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
        currency={settings.currency}
        content={{
          heading: homepage?.heroHeading ?? "Sports Shoes",
          subheading: homepage?.heroSubheading ?? "Men's collection",
          description: homepage?.heroDescription ?? BRAND.description,
          ctaLabel: homepage?.heroCtaLabel ?? "Shop now",
          ctaUrl: homepage?.heroCtaUrl ?? "/shop",
        }}
        slides={heroSlides.map((slide, i) => ({
          ...slide,
          alt: slide.product
            ? `${slide.product.name}`
            : `${settings.storeName} featured product ${i + 1}`,
        }))}
      />

      {/* ------------------------------------------------------- promises -- */}
      <section aria-label="Why shop with us" className="border-b border-border">
        <Stagger className="mx-auto grid max-w-content grid-cols-2 gap-x-6 gap-y-8 px-5 py-10 sm:px-8 lg:grid-cols-4 lg:px-12">
          {promises.map(({ Icon, title, body }) => (
            <StaggerItem key={title} className="flex items-start gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/40 text-gold-ink">
                <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ---------------------------------------------- popular right now -- */}
      <section id="popular" className="mx-auto max-w-content scroll-mt-28 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <FadeIn>
          <SectionHeading
            align="center"
            eyebrow="Curated this week"
            title="Popular right now"
            description="What people are actually buying — updated as orders come in."
          />
          <div className="mt-9">
            <PopularPills pills={pills} />
          </div>
        </FadeIn>

        {popularProducts.length > 0 ? (
          <Stagger className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {popularProducts.map((product: ProductCardData, i) => (
              <StaggerItem key={product.id}>
                <ProductCard
                  product={product}
                  saved={saved.has(product.id)}
                  currency={settings.currency}
                  priority={i < 2}
                />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <p className="mt-12 rounded-card border border-dashed border-border py-14 text-center text-muted-foreground">
            Nothing in this category yet — try another.
          </p>
        )}
      </section>

      {/* ---------------------------------------------------------- promo -- */}
      {banner && <PromoBand banner={banner} />}

      {/* --------------------------------------------------- new arrivals -- */}
      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-content px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <FadeIn className="mb-10">
            <SectionHeading
              eyebrow="Just landed"
              title="New arrivals"
              description="The latest drops, straight off the bench."
              action={{ href: "/shop?sort=newest", label: "View all" }}
            />
          </FadeIn>
          <NewArrivalsRail products={newArrivals} currency={settings.currency} />
        </section>
      )}

      {/* ----------------------------------------------------- categories -- */}
      {categories.length > 0 && (
        <section className="surface-dark">
          <div className="mx-auto max-w-content px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
            <FadeIn className="mb-10">
              <SectionHeading
                tone="dark"
                eyebrow="Collections"
                title="Shop by category"
                action={{ href: "/shop", label: "Shop everything" }}
              />
            </FadeIn>

            {departments.length > 1 ? (
              // A store with several departments leads with them — Footwear,
              // Clothing — each listing the categories inside it.
              <Stagger
                className={
                  departments.length > 2
                    ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                    : "grid gap-4 md:grid-cols-2"
                }
              >
                {departments.map((d) => (
                  <StaggerItem key={d.slug}>
                    <div className="group relative aspect-[4/5] overflow-hidden rounded-card bg-white/5 sm:aspect-[16/12] lg:aspect-[16/11]">
                      {d.imageUrl && (
                        <Image
                          src={d.imageUrl}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover opacity-75 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-90"
                        />
                      )}
                      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
                      {/* Whole tile opens the department; the chips sit above it. */}
                      <Link href={`/category/${d.slug}`} aria-label={`Shop ${d.name}`} className="absolute inset-0" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 sm:p-8">
                        <p className="eyebrow text-[0.62rem] text-gold-light">
                          {d.productCount} {d.productCount === 1 ? "piece" : "pieces"}
                        </p>
                        <h3 className="mt-2 flex items-center gap-3 font-display text-[clamp(2rem,3.4vw,3rem)] font-medium leading-none text-ivory">
                          {d.name}
                          <ArrowRight
                            className="h-6 w-6 -translate-x-1 text-gold-light opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
                            aria-hidden
                          />
                        </h3>
                        {d.children.length > 0 && (
                          <ul className="pointer-events-auto mt-5 flex flex-wrap gap-2">
                            {d.children.map((c) => (
                              <li key={c.slug}>
                                <Link
                                  href={`/category/${c.slug}`}
                                  className="inline-flex h-9 items-center rounded-pill border border-white/25 bg-ink/40 px-4 text-[0.8rem] text-ivory/90 backdrop-blur-sm transition-colors hover:border-gold-light hover:text-ivory"
                                >
                                  {c.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            ) : (
              <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                {categories.map((category, i) => (
                  <StaggerItem key={category.slug} className={i === 0 ? "col-span-2 sm:col-span-1" : undefined}>
                    <Link
                      href={`/category/${category.slug}`}
                      className="group relative block aspect-[3/4] overflow-hidden rounded-card bg-white/5"
                    >
                      {category.imageUrl && (
                        <Image
                          src={category.imageUrl}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                        />
                      )}
                      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                        <span className="font-display text-xl text-ivory">{category.name}</span>
                        <ArrowRight className="h-4 w-4 -translate-x-1 text-gold-light opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                      </span>
                    </Link>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- weekly pick -- */}
      {weeklyPick && (
        <section className="bg-muted/60">
          <div className="mx-auto max-w-content px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
            <FadeIn className="mb-12">
              <SectionHeading
                align="center"
                eyebrow="Editor’s choice"
                title={homepage?.weeklyPickHeading ?? "Our weekly pick"}
                description={homepage?.weeklyPickDesc ?? undefined}
              />
            </FadeIn>

            <FadeIn>
              <ProductDetail
                images={weeklyPick.images.map((i) => ({ url: i.url, alt: i.alt, colorId: i.colorId }))}
                panel={{
                  productId: weeklyPick.id,
                  productName: weeklyPick.name,
                  basePrice: effectivePrice(weeklyPick).base,
                  salePrice: effectivePrice(weeklyPick).sale,
                  colors: weeklyPick.colors.map((c) => ({ id: c.id, name: c.name, hex: c.hex })),
                  sizes: weeklyPick.sizes.map((s) => ({ id: s.id, label: s.label })),
                  variants: weeklyPick.variants.map((v) => ({
                    id: v.id,
                    colorId: v.colorId,
                    sizeId: v.sizeId,
                    inventory: v.inventory ? { available: v.inventory.available } : null,
                  })),
                  rating: ratingSummary(weeklyPick.reviews),
                  savedToWishlist: saved.has(weeklyPick.id),
                  currency: settings.currency,
                  compact: true,
                }}
              />
              <p className="mt-8 text-center">
                <Link
                  href={`/products/${weeklyPick.slug}`}
                  className="text-sm font-medium uppercase tracking-[0.14em] underline decoration-gold underline-offset-8"
                >
                  Full details for {weeklyPick.name}
                </Link>
              </p>
            </FadeIn>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------- reviews -- */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-content px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <FadeIn className="mb-12">
            <SectionHeading
              align="center"
              eyebrow="In their words"
              title="Worn, then reviewed"
              description="Straight from verified customers — unedited, and only ever from approved reviews."
            />
          </FadeIn>

          <Stagger className="grid gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <StaggerItem key={review.id}>
                <figure className="flex h-full flex-col rounded-card border border-border bg-background p-7 shadow-card">
                  <Quote className="h-7 w-7 text-gold" aria-hidden />
                  <Rating value={review.rating} showCount={false} size={14} className="mt-5" />
                  {review.title && (
                    <p className="mt-3 font-display text-xl leading-snug">{review.title}</p>
                  )}
                  <blockquote className="mt-2 flex-1 leading-relaxed text-muted-foreground">
                    {review.comment}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5 text-sm">
                    <span className="font-semibold">{review.author}</span>
                    <Link
                      href={`/products/${review.product.slug}`}
                      className="truncate text-gold-ink underline-offset-4 hover:underline"
                    >
                      {review.product.name}
                    </Link>
                  </figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {/* ----------------------------------------------------- membership -- */}
      <section className="surface-dark relative isolate overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_50%_100%,rgb(201_161_74/0.22),transparent_70%)]"
        />
        <FadeIn className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8 lg:py-32">
          <p className="eyebrow text-gold-light">Members’ circle</p>
          <h2 className="mt-5 font-display text-[clamp(2.2rem,5vw,3.75rem)] font-medium leading-[1.05] text-ivory">
            {homepage?.membershipHeading ?? "Join the members’ circle"}
          </h2>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-ivory/60">
            Track every order, save your addresses and sizes, keep a wishlist —
            and hear about new drops first.
          </p>
          <Link
            href={homepage?.membershipCtaUrl ?? "/register"}
            className="group mt-10 inline-flex h-14 items-center gap-3 rounded-pill bg-gold-gradient px-9 text-sm font-semibold uppercase tracking-[0.14em] text-ink shadow-gold transition-transform hover:-translate-y-0.5"
          >
            {homepage?.membershipCtaLabel ?? "Join for free"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </FadeIn>
      </section>
    </>
  );
}
