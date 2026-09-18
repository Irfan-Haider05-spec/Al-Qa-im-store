"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { WishlistButton } from "@/components/product/wishlist-button";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/utils/format";
import { addToCart } from "@/lib/cart/actions";
import { cn } from "@/lib/utils/cn";

export type PanelVariant = {
  id: string;
  colorId: string | null;
  sizeId: string | null;
  inventory: { available: number } | null;
};

export type BuyPanelProps = {
  productId: string;
  productName: string;
  basePrice: number;
  salePrice: number | null;
  colors: { id: string; name: string; hex: string }[];
  sizes: { id: string; label: string }[];
  variants: PanelVariant[];
  rating: { average: number; count: number };
  currency?: string;
  savedToWishlist?: boolean;
  /** Lets a parent swap the gallery when the colour changes. */
  onColorChange?: (colorId: string | null) => void;
  /** Tighter spacing and no heading, for the homepage Weekly Pick block. */
  compact?: boolean;
};

export function BuyPanel({
  productId,
  productName,
  basePrice,
  salePrice,
  colors,
  sizes,
  variants,
  rating,
  currency = "USD",
  savedToWishlist = false,
  onColorChange,
  compact = false,
}: BuyPanelProps) {
  const [colorId, setColorId] = useState<string | null>(colors[0]?.id ?? null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const selectedVariant = useMemo(
    () =>
      variants.find(
        (v) => (v.colorId ?? null) === colorId && (v.sizeId ?? null) === sizeId
      ) ?? null,
    [variants, colorId, sizeId]
  );

  /** Stock per size for the chosen colour, so sold-out sizes read as sold out. */
  const stockBySize = useMemo(() => {
    const map = new Map<string, number>();
    for (const size of sizes) {
      const variant = variants.find(
        (v) => v.colorId === colorId && v.sizeId === size.id
      );
      map.set(size.id, variant?.inventory?.available ?? 0);
    }
    return map;
  }, [sizes, variants, colorId]);

  const stock = selectedVariant?.inventory?.available ?? 0;
  const totalStock = useMemo(
    () => variants.reduce((n, v) => n + (v.inventory?.available ?? 0), 0),
    [variants]
  );
  const price = salePrice ?? basePrice;
  const hasDiscount = salePrice != null && salePrice < basePrice;

  const pickColor = (id: string) => {
    setColorId(id);
    setSizeId(null);
    setQuantity(1);
    setError(null);
    onColorChange?.(id);
  };

  /** Shared by both buttons. Resolves to true only when the line was added. */
  const submit = async () => {
    if (!sizeId) {
      setError("Choose a size first.");
      return false;
    }
    if (!selectedVariant) {
      setError("That colour and size combination isn't available.");
      return false;
    }

    const result = await addToCart(selectedVariant.id, quantity);
    if (!result.ok) {
      setError(result.error ?? "Could not add to cart.");
      return false;
    }
    setError(null);
    return true;
  };

  const onAddToCart = () =>
    startTransition(async () => {
      if (await submit()) {
        toast(`${productName} added to your cart.`);
        router.refresh();
      }
    });

  const onBuyNow = () =>
    startTransition(async () => {
      if (await submit()) router.push("/checkout");
    });

  return (
    <div className={cn("space-y-6", compact && "space-y-5")}>
      <div>
        {compact ? (
          <h3 className="font-display text-[1.7rem] font-medium tracking-[-0.01em]">{productName}</h3>
        ) : (
          <h1 className="font-display text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.015em]">
            {productName}
          </h1>
        )}

        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-2xl font-semibold text-foreground">
            {formatPrice(price, currency)}
          </span>
          {hasDiscount && (
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(basePrice, currency)}
            </span>
          )}
        </div>

        <div className="mt-2">
          <Rating value={rating.average} count={rating.count} />
        </div>
      </div>

      <div className={cn("grid gap-6", compact && "grid-cols-2 gap-5")}>
        {colors.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Colour</legend>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickColor(c.id)}
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={colorId === c.id}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full border-2 transition-colors",
                    colorId === c.id ? "border-primary" : "border-border hover:border-primary/50"
                  )}
                >
                  <span
                    className="h-6 w-6 rounded-full border border-black/5"
                    style={{ backgroundColor: c.hex }}
                  />
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {sizes.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Size</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const available = stockBySize.get(s.id) ?? 0;
                const soldOut = available <= 0;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() => {
                      setSizeId(s.id);
                      setQuantity(1);
                      setError(null);
                    }}
                    aria-pressed={sizeId === s.id}
                    aria-label={soldOut ? `Size ${s.label} — sold out` : `Size ${s.label}`}
                    className={cn(
                      "h-10 min-w-[2.75rem] rounded-control border px-3 text-sm transition-colors",
                      sizeId === s.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary",
                      soldOut && "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:border-border"
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      </div>

      <p className="text-sm" aria-live="polite">
        {sizeId ? (
          stock > 5 ? (
            <span className="text-success">In stock — ships within 24 hours</span>
          ) : stock > 0 ? (
            <span className="text-warning">Only {stock} left in this size</span>
          ) : (
            <span className="text-danger">Sold out in this size</span>
          )
        ) : totalStock > 0 ? (
          <span className="text-muted-foreground">Select a size to check availability</span>
        ) : (
          <span className="text-danger">Currently sold out</span>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-pill border border-border">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="grid h-12 w-12 place-items-center rounded-l-pill transition-colors hover:bg-muted"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-medium" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(Math.max(stock, 1), q + 1))}
            disabled={sizeId != null && quantity >= stock}
            className="grid h-12 w-12 place-items-center rounded-r-pill transition-colors hover:bg-muted disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onAddToCart}
          disabled={pending || totalStock === 0}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-pill bg-primary px-8 text-sm font-medium text-primary-foreground shadow-card transition-colors hover:bg-primary-deep disabled:opacity-50 sm:flex-none"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden />
          {pending ? "Adding…" : "Add to cart"}
        </button>

        <button
          type="button"
          onClick={onBuyNow}
          disabled={pending || totalStock === 0}
          className="bg-gold-gradient inline-flex h-12 items-center justify-center rounded-pill px-8 text-sm font-semibold text-ink shadow-gold transition-[filter] hover:brightness-105 disabled:opacity-50"
        >
          Buy it now
        </button>

        <WishlistButton
          productId={productId}
          productName={productName}
          initialSaved={savedToWishlist}
          variant="labelled"
          className="h-12"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {!compact && (
        <ul className="grid gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:grid-cols-3">
          {[
            { icon: Truck, label: "Ships in 24 hours" },
            { icon: RotateCcw, label: "30-day returns" },
            { icon: ShieldCheck, label: "Secure checkout" },
          ].map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
