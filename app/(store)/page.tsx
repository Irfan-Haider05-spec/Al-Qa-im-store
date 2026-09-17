import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getProducts, getCategories } from "@/lib/products/queries";
import { ProductCard, type CardProduct } from "@/components/product/product-card";
import { HeroCycler } from "@/components/animations/hero-cycler";
import { FadeIn } from "@/components/animations/fade-in";

async function getHomepage() {
  try {
    const hp = await prisma.homepage.findFirst({
      include: {
        slides: {
          where: { isActive: true },
          orderBy: { position: "asc" },
        },
      },
    });
    if (hp) return hp;
  } catch {
    /* DB not migrated yet */
  }
  return {
    heroHeading: "SPORTS SHOES",
    heroSubheading: "Men's collection",
    heroDescription:
      "Discover premium footwear designed for movement, comfort and everyday style.",
    heroCtaLabel: "Shop Now",
    heroCtaUrl: "/shop",
    membershipHeading: "Become a member and get 20% off",
    membershipCtaLabel: "Sign up for free now",
    membershipCtaUrl: "/register",
    slides: [] as { imageUrl: string }[],
  };
}

export default async function HomePage() {
  const hp = await getHomepage();

  let newArrivals: CardProduct[] = [];
  let categories: { slug: string; name: string }[] = [];
  try {
    const [{ products }, cats] = await Promise.all([
      getProducts({ sort: "newest", perPage: 4 }),
      getCategories(),
    ]);
    newArrivals = products as unknown as CardProduct[];
    categories = cats;
  } catch {
    /* ignore before seed */
  }

  const heroSlides = (hp.slides ?? []).map((s: { imageUrl: string }) => ({
    imageUrl: s.imageUrl,
    alt: hp.heroHeading,
  }));

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-background pb-20 pt-28 sm:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-8%] top-0 h-[520px] w-[520px] rounded-full bg-primary"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[6%] top-[38%] h-24 w-24 rounded-full bg-primary/80"
        />
        <div className="relative mx-auto grid max-w-content items-center gap-10 px-5 sm:px-8 lg:grid-cols-2">
          <FadeIn className="max-w-lg" y={24}>
            <h1 className="font-display text-6xl font-bold leading-[0.95] sm:text-7xl">
              {hp.heroHeading}
            </h1>
            <p className="mt-2 font-display text-2xl font-medium text-primary">
              {hp.heroSubheading}
            </p>
            <p className="mt-5 max-w-md text-muted-foreground">
              {hp.heroDescription}
            </p>
            <div className="mt-8">
              <Link
                href={hp.heroCtaUrl}
                className="inline-flex h-13 items-center justify-center gap-2 rounded-pill bg-primary px-8 py-3.5 text-base font-medium text-primary-foreground shadow-card transition-colors hover:bg-primary-deep"
              >
                {hp.heroCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>

          <div className="relative hidden h-[420px] lg:block">
            <HeroCycler slides={heroSlides} />
          </div>
        </div>
      </section>

      {/* POPULAR RIGHT NOW */}
      <FadeIn>
        <section className="mx-auto max-w-content px-5 py-16 text-center sm:px-8">
          <h2 className="font-display text-3xl font-bold">POPULAR RIGHT NOW</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="rounded-pill border border-border px-5 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* NEW ARRIVAL */}
      {newArrivals.length > 0 && (
        <FadeIn>
          <section className="mx-auto max-w-content px-5 pb-16 sm:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">New Arrival</h2>
              <Link
                href="/shop?sort=newest"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* MEMBERSHIP CTA */}
      <section className="bg-primary py-20 text-center text-primary-foreground">
        <FadeIn className="mx-auto max-w-content px-5 sm:px-8">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {hp.membershipHeading ?? "Become a member and get 20% off"}
          </h2>
          <Link
            href={hp.membershipCtaUrl ?? "/register"}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-pill bg-white px-8 font-medium text-primary hover:bg-white/90"
          >
            {hp.membershipCtaLabel ?? "Sign up for free now"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </FadeIn>
      </section>
    </>
  );
}
