"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string; alt: string | null }[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-card bg-muted text-muted-foreground">
        No image
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-card bg-muted">
        <Image
          src={images[active].url}
          alt={images[active].alt ?? name}
          fill
          priority
          sizes="(max-width:1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === active}
              className={`relative h-20 w-20 overflow-hidden rounded-control border-2 ${
                i === active ? "border-primary" : "border-transparent"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${name} ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
