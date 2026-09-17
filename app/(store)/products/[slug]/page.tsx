import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/products/queries";
import { effectivePrice, ratingSummary } from "@/lib/products/pricing";
import { ProductGallery } from "@/components/product/product-gallery";
import { BuyPanel } from "@/components/product/buy-panel";
import { ProductCard } from "@/components/product/product-card";
import { Rating } from "@/components/ui/rating";

// Local shapes for arrays whose element types come from the Prisma include.
type ImageRow = { url: string; alt: string | null };
type ColorRow = { id: string; name: string; hex: string };
type SizeRow = { id: string; label: string };
type VariantRow = {
  id: string;
  colorId: string | null;
  sizeId: string | null;
  price: unknown;
  salePrice: unknown;
  inventory: { available: number } | null;
};
type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  user: { name: string | null } | null;
};
// Related products carry the productCardInclude shape; ProductCard types it loosely.
type RelatedRow = React.ComponentProps<typeof ProductCard>["product"] & {
  id: string;
};

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

  const { base, sale, price } = effectivePrice(product);
  const rating = ratingSummary(product.reviews);
  const related = await getRelatedProducts(product.categoryId, product.id);

  // Product JSON-LD (only include rating when real reviews exist).
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.shortDesc ?? product.description ?? undefined,
    sku: product.sku ?? undefined,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand.name }
      : undefined,
    image: product.images.map((i: ImageRow) => i.url),
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    ...(rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.average.toFixed(1),
            reviewCount: rating.count,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-content px-5 pb-20 pt-28 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/shop" className="hover:text-foreground">
          Shop
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <BuyPanel
          productName={product.name}
          basePrice={base}
          salePrice={sale}
          colors={product.colors.map((c: ColorRow) => ({
            id: c.id,
            name: c.name,
            hex: c.hex,
          }))}
          sizes={product.sizes.map((s: SizeRow) => ({ id: s.id, label: s.label }))}
          variants={product.variants.map((v: VariantRow) => ({
            id: v.id,
            colorId: v.colorId,
            sizeId: v.sizeId,
            price: v.price != null ? String(v.price) : null,
            salePrice: v.salePrice != null ? String(v.salePrice) : null,
            inventory: v.inventory
              ? { available: v.inventory.available }
              : null,
          }))}
          rating={rating}
        />
      </div>

      {/* Description + specs */}
      <section className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-bold">Description</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border py-2">
              <dt className="text-muted-foreground">Brand</dt>
              <dd>{product.brand?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-2">
              <dt className="text-muted-foreground">Category</dt>
              <dd>{product.category?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-2">
              <dt className="text-muted-foreground">SKU</dt>
              <dd>{product.sku ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-2">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>Free over $100 · flat $5 otherwise</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Returns</dt>
              <dd>30-day returns</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Reviews */}
      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold">Reviews</h2>
        {product.reviews.length === 0 ? (
          <p className="mt-3 text-muted-foreground">
            No reviews yet. Purchase this product to leave the first review.
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            <Rating value={rating.average} count={rating.count} />
            <ul className="space-y-5">
              {product.reviews.map((r: ReviewRow) => (
                <li key={r.id} className="border-b border-border pb-5">
                  <div className="flex items-center gap-3">
                    <Rating value={r.rating} showCount={false} size={14} />
                    <span className="text-sm font-medium">
                      {r.user?.name ?? "Verified buyer"}
                    </span>
                  </div>
                  {r.title && (
                    <p className="mt-2 font-medium">{r.title}</p>
                  )}
                  {r.comment && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((p: RelatedRow) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
