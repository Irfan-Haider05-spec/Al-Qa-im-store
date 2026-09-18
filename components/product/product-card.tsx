import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
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
  const lowStock = stock != null && stock > 0 && stock <= 5;
  const href = `/products/${product.slug}`;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-muted">
        <Link href={href} className="absolute inset-0" aria-label={product.name}>
          {primary ? (
            <>
              <Image
                src={primary.url}
                alt={primary.alt ?? product.name}
                fill
                priority={priority}
                sizes={sizes}
                className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
              />
              {/* Second shot fades in over the first on hover — a real
                  gallery peek, not a zoom of the same photo. */}
              {secondary && (
                <Image
                  src={secondary.url}
                  alt=""
                  fill
                  sizes={sizes}
                  className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <span className="grid h-full place-items-center text-sm text-muted-foreground">No image</span>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <Badge tone="muted">Sold out</Badge>
          ) : (
            <>
              {hasDiscount && <Badge tone="accent">−{discountPct}%</Badge>}
              {product.isNewArrival && <Badge tone="primary">New</Badge>}
            </>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} productName={product.name} initialSaved={saved} />
        </div>

        {/* "View" bar slides up on hover (always visible on touch). */}
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-pill bg-ink/90 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ivory backdrop-blur transition duration-300 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          {soldOut ? "View details" : "Choose size"}
          <ArrowUpRight className="h-4 w-4 text-gold-light" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {product.category && (
          <p className="eyebrow text-[0.62rem] text-gold-ink">{product.category.name}</p>
        )}

        <h3 className="mt-1.5 font-display text-lg leading-snug">
          <Link href={href} className="transition-colors hover:text-gold-ink">
            {product.name}
          </Link>
        </h3>

        <div className="mt-1.5">
          <Rating value={average} count={count} size={13} />
        </div>

        <div className="mt-auto flex items-baseline justify-between gap-3 pt-3">
          <p className="flex items-baseline gap-2">
            <span className="font-semibold">{formatPrice(price, currency)}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(base, currency)}
              </span>
            )}
          </p>

          {product.colors.length > 0 && (
            <span className="flex items-center gap-1" aria-label={`${product.colors.length} colours`}>
              {product.colors.slice(0, 4).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-muted-foreground">+{product.colors.length - 4}</span>
              )}
            </span>
          )}
        </div>

        {lowStock && !soldOut && (
          <p className="mt-2 text-xs font-medium text-warning">Only {stock} left</p>
        )}
      </div>
    </article>
  );
}
