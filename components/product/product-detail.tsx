"use client";

import { useState } from "react";
import { ProductGallery, type GalleryImage } from "@/components/product/product-gallery";
import { BuyPanel, type BuyPanelProps } from "@/components/product/buy-panel";

/**
 * Joins the gallery and the buy panel so choosing a colour swaps the photos.
 * Only this wrapper is a client component — the rest of the product page stays
 * server-rendered, which keeps the description and reviews crawlable.
 */
export function ProductDetail({
  images,
  panel,
}: {
  images: GalleryImage[];
  panel: Omit<BuyPanelProps, "onColorChange">;
}) {
  const [colorId, setColorId] = useState<string | null>(
    panel.colors[0]?.id ?? null
  );

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <ProductGallery
        images={images}
        name={panel.productName}
        activeColorId={colorId}
      />
      <BuyPanel {...panel} onColorChange={setColorId} />
    </div>
  );
}
