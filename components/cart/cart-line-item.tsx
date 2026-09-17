"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { updateCartItem, removeCartItem } from "@/lib/cart/actions";
import type { CartLine } from "@/lib/cart/get-cart";

export function CartLineItem({
  line,
  currency = "USD",
}: {
  line: CartLine;
  currency?: string;
}) {
  const [pending, startTransition] = useTransition();

  const setQty = (q: number) =>
    startTransition(async () => {
      await updateCartItem(line.variantId, q);
    });

  const remove = () =>
    startTransition(async () => {
      await removeCartItem(line.variantId);
    });

  return (
    <div
      className={`flex gap-4 border-b border-border py-5 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <Link
        href={`/products/${line.productSlug}`}
        className="relative h-24 w-24 flex-none overflow-hidden rounded-control bg-muted"
      >
        {line.imageUrl ? (
          <Image
            src={line.imageUrl}
            alt={line.productName}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between gap-4">
          <div>
            <Link
              href={`/products/${line.productSlug}`}
              className="font-medium hover:text-primary"
            >
              {line.productName}
            </Link>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {[line.colorName, line.sizeLabel].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            onClick={remove}
            aria-label="Remove item"
            className="text-muted-foreground hover:text-danger"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center rounded-pill border border-border">
            <button
              aria-label="Decrease quantity"
              onClick={() => setQty(line.quantity - 1)}
              className="grid h-9 w-9 place-items-center"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-7 text-center text-sm">{line.quantity}</span>
            <button
              aria-label="Increase quantity"
              onClick={() => setQty(line.quantity + 1)}
              disabled={line.quantity >= line.available}
              className="grid h-9 w-9 place-items-center disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="font-semibold">
            {formatPrice(line.lineTotal, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
