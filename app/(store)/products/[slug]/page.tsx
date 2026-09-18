import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getRelatedProducts } from "@/lib/products/queries";
import { effectivePrice, ratingSummary, totalStock } from "@/lib/products/pricing";
import { getSiteSettings, describeShipping } from "@/lib/settings/site";
import { getWishlistProductIds } from "@/lib/account/wishlist-actions";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductCard } from "@/components/product/product-card";
import { Rating } from "@/components/ui/rating";
import { ReviewForm } from "@/components/product/review-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getReviewEligibility } from "@/lib/reviews/eligibility";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const title = product.seoTitle ?? product.name;
  const description =
    product.seoDesc ?? product.shortDesc ?? product.description ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: product.ogImageUrl
        ? [product.ogImageUrl]
        : product.images[0]
          ? [product.images[0].url]
          : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, settings, saved, viewer] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    getSiteSettings(),
    getWishlistProductIds(),
    getCurrentUser(),
  ]);
  const reviewState = await getReviewEligibility(product.id, viewer?.id ?? null);

  const { base, sale, price } = effectivePrice(product);
  const rating = ratingSummary(product.reviews);
  const stock = totalStock(product.variants);

  // Rating distribution, so the summary shows more than one number.
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: product.reviews.filter((r) => r.rating === star).length,
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.shortDesc ?? product.description ?? undefined,
        sku: product.sku ?? undefined,
        brand: product.brand
          ? { "@type": "Brand", name: product.brand.name }
          : undefined,
        image: product.images.map((i) => `${siteUrl}${i.url}`),
        offers: {
          "@type": "Offer",
          url: `${siteUrl}/products/${product.slug}`,
          price: price.toFixed(2),
          priceCurrency: settings.currency,
          // Reflects real inventory rather than always claiming availability.
          availability:
            stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
        // Only asserted when approved reviews actually exist.
        ...(rating.count > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: rating.average.toFixed(1),
                reviewCount: rating.count,
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop` },
          ...(product.category
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: product.category.name,
                  item: `${siteUrl}/category/${product.category.slug}`,
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: product.category ? 4 : 3,
            name: product.name,
          },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-content px-5 pb-24 pt-36 sm:px-8 lg:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/shop" className="transition-colors hover:text-foreground">
          Shop
        </Link>
        {product.category && (
          <>
            <span className="mx-1.5">/</span>
            <Link
              href={`/category/${product.category.slug}`}
              className="transition-colors hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <ProductDetail
        images={product.images.map((i) => ({
          url: i.url,
          alt: i.alt,
          colorId: i.colorId,
        }))}
        panel={{
          productId: product.id,
          productName: product.name,
          basePrice: base,
          salePrice: sale,
          colors: product.colors.map((c) => ({ id: c.id, name: c.name, hex: c.hex })),
          sizes: product.sizes.map((s) => ({ id: s.id, label: s.label })),
          variants: product.variants.map((v) => ({
            id: v.id,
            colorId: v.colorId,
            sizeId: v.sizeId,
            inventory: v.inventory ? { available: v.inventory.available } : null,
          })),
          rating,
          currency: settings.currency,
          savedToWishlist: saved.has(product.id),
        }}
      />

      <section className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="font-display text-[1.7rem] font-medium tracking-[-0.01em]">Description</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </div>

        <div>
          <h2 className="font-display text-[1.7rem] font-medium tracking-[-0.01em]">Details</h2>
          <dl className="mt-4 text-sm">
            {[
              ["Brand", product.brand?.name ?? "—"],
              ["Category", product.category?.name ?? "—"],
              ["SKU", product.sku ?? "—"],
              ["Shipping", describeShipping(settings)],
              ["Returns", "30 days, unworn and in original packaging"],
            ].map(([term, value]) => (
              <div
                key={term}
                className="flex justify-between gap-6 border-b border-border py-3"
              >
                <dt className="text-muted-foreground">{term}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="reviews" className="mt-16 scroll-mt-32">
        <h2 className="font-display text-[1.7rem] font-medium tracking-[-0.01em]">
          Reviews{rating.count > 0 && ` (${rating.count})`}
        </h2>

        {product.reviews.length === 0 ? (
          <p className="mt-4 rounded-card border border-dashed border-border p-8 text-center text-muted-foreground">
            No reviews yet — customers can review this product once their order arrives.
          </p>
        ) : (
          <div className="mt-6 grid gap-10 lg:grid-cols-[18rem_1fr]">
            <div className="rounded-card border border-border p-6">
              <p className="font-display text-5xl font-medium">
                {rating.average.toFixed(1)}
              </p>
              <div className="mt-2">
                <Rating value={rating.average} count={rating.count} />
              </div>

              <ul className="mt-5 space-y-2">
                {distribution.map(({ star, count }) => (
                  <li key={star} className="flex items-center gap-3 text-sm">
                    <span className="w-8 text-muted-foreground">{star}★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-pill bg-muted">
                      <span
                        className="block h-full rounded-pill bg-accent"
                        style={{
                          width: `${rating.count ? (count / rating.count) * 100 : 0}%`,
                        }}
                      />
                    </span>
                    <span className="w-6 text-right text-muted-foreground">{count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <ul className="space-y-6">
              {product.reviews.map((review) => (
                <li key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <Rating value={review.rating} showCount={false} size={14} />
                    <span className="text-sm font-medium">
                      {review.user?.name ?? "Verified buyer"}
                    </span>
                    <time
                      dateTime={review.createdAt.toISOString()}
                      className="text-xs text-muted-foreground"
                    >
                      {review.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  {review.title && <p className="mt-2 font-medium">{review.title}</p>}
                  {review.comment && (
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 max-w-2xl">
          {reviewState === "eligible" ? (
            <ReviewForm productId={product.id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {reviewState === "signed-out" ? (
                <>
                  Bought this pair?{" "}
                  <Link
                    href={`/login?next=${encodeURIComponent(`/products/${product.slug}#reviews`)}`}
                    className="font-medium text-foreground underline underline-offset-4 hover:text-gold-ink"
                  >
                    Sign in
                  </Link>{" "}
                  to share your review.
                </>
              ) : reviewState === "reviewed" ? (
                "Thanks — you've already reviewed this product."
              ) : (
                "Reviews open to customers once their order has been delivered."
              )}
            </p>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-[1.7rem] font-medium tracking-[-0.01em]">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} saved={saved.has(p.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
