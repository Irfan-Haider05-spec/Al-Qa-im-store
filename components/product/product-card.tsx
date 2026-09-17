import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { formatPrice } from "@/lib/utils/format";
import { effectivePrice, ratingSummary } from "@/lib/products/pricing";

// Loose typing so this accepts the productCardInclude shape without friction.
export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  basePrice: unknown;
  salePrice: unknown;
  images: { url: string; alt: string | null }[];
  colors: { hex: string; name: string }[];
  reviews: { rating: number }[];
  isNewArrival?: boolean;
};

export function ProductCard({
  product,
  currency = "USD",
}: {
  product: CardProduct;
  currency?: string;
}) {
  const { price, hasDiscount, base, discountPct } = effectivePrice(
    product as never
  );
  const { average, count } = ratingSummary(product.reviews);
  const img = product.images[0];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-background transition-shadow hover:shadow-hover">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        {img ? (
          <Image
            src={img.url}
            alt={img.alt ?? product.name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            No image
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.isNewArrival && <Badge tone="primary">New</Badge>}
          {hasDiscount && <Badge tone="accent">-{discountPct}%</Badge>}
        </div>

        <button
          type="button"
          aria-label="Add to wishlist"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground/70 opacity-0 shadow-card transition-opacity hover:text-accent group-hover:opacity-100"
        >
          <Heart className="h-4 w-4" />
        </button>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/products/${product.slug}`} className="hover:text-primary">
          <h3 className="font-medium leading-snug">{product.name}</h3>
        </Link>

        <Rating value={average} count={count} size={14} />

        <div className="mt-auto flex items-center gap-2">
          <span className="font-semibold">
            {formatPrice(price, currency)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(base, currency)}
            </span>
          )}
        </div>

        {product.colors.length > 0 && (
          <div className="flex gap-1.5 pt-1">
            {product.colors.slice(0, 5).map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
