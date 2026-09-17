"use client";

import { useMemo, useState, useTransition } from "react";
import { Heart, Minus, Plus, Check } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { formatPrice } from "@/lib/utils/format";
import { addToCart } from "@/lib/cart/actions";

type Variant = {
  id: string;
  colorId: string | null;
  sizeId: string | null;
  price: string | null;
  salePrice: string | null;
  inventory: { available: number } | null;
};

type BuyPanelProps = {
  productName: string;
  basePrice: number;
  salePrice: number | null;
  colors: { id: string; name: string; hex: string }[];
  sizes: { id: string; label: string }[];
  variants: Variant[];
  rating: { average: number; count: number };
  currency?: string;
};

export function BuyPanel({
  productName,
  basePrice,
  salePrice,
  colors,
  sizes,
  variants,
  rating,
  currency = "USD",
}: BuyPanelProps) {
  const [colorId, setColorId] = useState<string | null>(
    colors[0]?.id ?? null
  );
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // The variant matching the current color+size selection.
  const selectedVariant = useMemo(
    () =>
      variants.find(
        (v) =>
          (v.colorId ?? null) === (colorId ?? null) &&
          (v.sizeId ?? null) === (sizeId ?? null)
      ) ?? null,
    [variants, colorId, sizeId]
  );

  // Which sizes are in stock for the chosen color.
  const sizeAvailability = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sizes) {
      const v = variants.find(
        (vv) => vv.colorId === colorId && vv.sizeId === s.id
      );
      map.set(s.id, v?.inventory?.available ?? 0);
    }
    return map;
  }, [sizes, variants, colorId]);

  const stock = selectedVariant?.inventory?.available ?? 0;
  const price = salePrice ?? basePrice;
  const hasDiscount = salePrice != null && salePrice < basePrice;

  function handleAdd() {
    setMsg(null);
    if (!sizeId) {
      setMsg({ ok: false, text: "Please select a size." });
      return;
    }
    if (!selectedVariant) {
      setMsg({ ok: false, text: "That combination is unavailable." });
      return;
    }
    startTransition(async () => {
      const res = await addToCart(selectedVariant.id, qty);
      setMsg(
        res.ok
          ? { ok: true, text: "Added to cart." }
          : { ok: false, text: res.error ?? "Could not add to cart." }
      );
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{productName}</h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl font-semibold text-primary">
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

      {/* Colour */}
      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Colour</p>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setColorId(c.id);
                  setSizeId(null);
                  setMsg(null);
                }}
                aria-label={c.name}
                aria-pressed={colorId === c.id}
                className={`grid h-9 w-9 place-items-center rounded-full border-2 ${
                  colorId === c.id ? "border-primary" : "border-border"
                }`}
              >
                <span
                  className="h-6 w-6 rounded-full"
                  style={{ backgroundColor: c.hex }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size */}
      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const avail = sizeAvailability.get(s.id) ?? 0;
              const disabled = avail <= 0;
              return (
                <button
                  key={s.id}
                  disabled={disabled}
                  onClick={() => {
                    setSizeId(s.id);
                    setMsg(null);
                  }}
                  aria-pressed={sizeId === s.id}
                  className={`h-10 min-w-[2.75rem] rounded-control border px-3 text-sm ${
                    sizeId === s.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  } ${disabled ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock line */}
      {sizeId && (
        <p className="text-sm text-muted-foreground">
          {stock > 0 ? `${stock} in stock` : "Out of stock"}
        </p>
      )}

      {/* Quantity + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-pill border border-border">
          <button
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-11 w-11 place-items-center"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center">{qty}</span>
          <button
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(stock || 99, q + 1))}
            className="grid h-11 w-11 place-items-center"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleAdd}
          disabled={pending || (sizeId != null && stock <= 0)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-pill bg-primary px-8 font-medium text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add to Cart"}
        </button>

        <button
          aria-label="Add to wishlist"
          className="grid h-11 w-11 place-items-center rounded-pill border border-border hover:text-accent"
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>

      {msg && (
        <p
          role="status"
          className={`flex items-center gap-2 text-sm ${
            msg.ok ? "text-success" : "text-danger"
          }`}
        >
          {msg.ok && <Check className="h-4 w-4" />}
          {msg.text}
        </p>
      )}
    </div>
  );
}
