"use client";

import { useState, useTransition } from "react";
import { setInventory } from "@/lib/admin/inventory-actions";

export function InventoryRow({
  variantId,
  sku,
  productName,
  variantLabel,
  available,
  lowStockAt,
}: {
  variantId: string;
  sku: string;
  productName: string;
  variantLabel: string;
  available: number;
  lowStockAt: number;
}) {
  const [value, setValue] = useState(available);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const low = value <= lowStockAt;
  const dirty = value !== available;

  function save() {
    startTransition(async () => {
      const res = await setInventory({ variantId, available: value });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    });
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium">{productName}</p>
        <p className="text-xs text-muted-foreground">{variantLabel}</p>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{sku}</td>
      <td className="px-4 py-3">
        {value === 0 ? (
          <span className="rounded-pill bg-danger/10 px-2 py-0.5 text-xs text-danger">
            Out of stock
          </span>
        ) : low ? (
          <span className="rounded-pill bg-warning/10 px-2 py-0.5 text-xs text-warning">
            Low
          </span>
        ) : (
          <span className="rounded-pill bg-success/10 px-2 py-0.5 text-xs text-success">
            In stock
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-24 rounded-control border border-border px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={save}
          disabled={pending || !dirty}
          className="inline-flex h-9 items-center rounded-pill bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-40"
        >
          {pending ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </td>
    </tr>
  );
}
