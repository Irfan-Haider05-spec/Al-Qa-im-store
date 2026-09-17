import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import { effectivePrice } from "@/lib/products/pricing";

export type RailProduct = {
  id: string;
  slug: string;
  name: string;
  basePrice: unknown;
  salePrice: unknown;
  images: { url: string; alt: string | null }[];
  category?: { name: string } | null;
};

/**
 * The editorial arrivals strip: big photographic tiles with the product name
 * set over the image, scrolling horizontally with snap points.
 *
 * It is a real scroll container rather than a JS carousel — that keeps it
 * keyboard- and trackpad-native, works with no JavaScript, and costs nothing
 * on the client.
 */
export function NewArrivalsRail({
  products,
  currency = "USD",
}: {
  products: RailProduct[];
  currency?: string;
}) {
  if (products.length === 0) return null;

  return (
    <ul
      className={[
        "flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4",
        // Bleed to the screen edge on mobile so tiles run off-canvas the way
        // the reference does, then settle into the content column.
        "-mx-5 px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0",
        "rail-scroll",
      ].join(" ")}
    >
      {products.map((product, i) => {
        const { price, hasDiscount, base } = effectivePrice(product as never);
        const image = product.images[0];

        return (
          <li
            key={product.id}
            className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]"
          >
            <Link
              href={`/products/${product.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-card bg-muted"
            >
              {image && (
                <Image
                  src={image.url}
                  alt={image.alt ?? product.name}
                  fill
                  priority={i < 2}
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 31vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              )}

              {/* Scrim: strong enough for white type at the bottom, invisible
                  over the product itself. */}
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-secondary/85 via-secondary/20 to-transparent"
              />

              <span className="absolute inset-x-0 bottom-0 p-6 text-white">
                {product.category && (
                  <span className="block text-xs uppercase tracking-[0.18em] text-white/75">
                    {product.category.name}
                  </span>
                )}
                <span className="mt-1.5 block font-display text-2xl font-bold leading-tight">
                  {product.name}
                </span>
                <span className="mt-1 flex items-baseline gap-2 text-sm">
                  <span className="font-semibold">{formatPrice(price, currency)}</span>
                  {hasDiscount && (
                    <span className="text-white/60 line-through">
                      {formatPrice(base, currency)}
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
