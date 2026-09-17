import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { WishlistButton } from "@/components/product/wishlist-button";
import { formatPrice } from "@/lib/utils/format";
import { effectivePrice, ratingSummary, totalStock } from "@/lib/products/pricing";

/** Structural shape rather than a Prisma type, so cards accept trimmed selects. */
export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  basePrice: unknown;
  salePrice: unknown;
  images: { url: string; alt: string | null }[];
  colors: { hex: string; name: string }[];
  reviews: { rating: number }[];
  variants?: { inventory: { available: number } | null }[];
  category?: { name: string } | null;
  isNewArrival?: boolean;
};

export function ProductCard({
  product,
  currency = "USD",
  saved = false,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: {
  product: CardProduct;
  currency?: string;
  saved?: boolean;
  priority?: boolean;
  sizes?: string;
}) {
  const { price, hasDiscount, base, discountPct } = effectivePrice(product as never);
  const { average, count } = ratingSummary(product.reviews);
  const [primary, secondary] = product.images;
  const stock = product.variants ? totalStock(product.variants) : null;
  const soldOut = stock === 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-hover">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0"
          // The whole card is one link target; the heading repeats the name for
          // assistive tech, so the image link itself stays out of the tab order
          // description.
          aria-label={product.name}
        >
          {primary ? (
            <>
              <Image
                src={primary.url}
                alt={primary.alt ?? product.name}
                fill
                priority={priority}
                sizes={sizes}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Second shot fades in over the first on hover — a real gallery
                  peek rather than a zoom on the same photo. */}
              {secondary && (
                <Image
                  src={secondary.url}
                  alt=""
                  fill
                  sizes={sizes}
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
                />
              )}
            </>
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-2">
          {soldOut ? (
            <Badge tone="muted">Sold out</Badge>
          ) : (
            <>
              {product.isNewArrival && <Badge tone="primary">New</Badge>}
              {hasDiscount && <Badge tone="accent">−{discountPct}%</Badge>}
            </>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <WishlistButton
            productId={product.id}
            productName={product.name}
            initialSaved={saved}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.category && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {product.category.name}
          </p>
        )}

        <h3 className="font-medium leading-snug">
          <Link
            href={`/products/${product.slug}`}
            className="transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>

        <Rating value={average} count={count} size={14} />

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-semibold">{formatPrice(price, currency)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(base, currency)}
            </span>
          )}
        </div>

        {product.colors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            {product.colors.slice(0, 5).map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{product.colors.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
