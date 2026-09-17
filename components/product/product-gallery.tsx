"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type GalleryImage = { url: string; alt: string | null; colorId?: string | null };

/**
 * Product gallery: thumbnails, arrow-key navigation, swipe on touch, and a
 * hover-to-zoom that tracks the pointer. The zoom is pointer-only — on touch
 * the panel would fight the page scroll, so it stays off there.
 */
export function ProductGallery({
  images,
  name,
  activeColorId = null,
}: {
  images: GalleryImage[];
  name: string;
  activeColorId?: string | null;
}) {
  // Colour-specific shots when they exist, otherwise the full set.
  const scoped = activeColorId
    ? images.filter((i) => i.colorId === activeColorId)
    : [];
  const shown = scoped.length > 0 ? scoped : images;

  const [active, setActive] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const frameRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);

  // Reset to the first shot whenever the visible set changes.
  useEffect(() => setActive(0), [activeColorId, images.length]);

  if (shown.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-card bg-muted text-muted-foreground">
        No image
      </div>
    );
  }

  const step = (delta: number) =>
    setActive((i) => (i + delta + shown.length) % shown.length);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const current = shown[Math.min(active, shown.length - 1)];

  return (
    <div className="space-y-4">
      <div
        ref={frameRef}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${name} images`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
        }}
        onPointerMove={onPointerMove}
        onPointerEnter={(e) => e.pointerType !== "touch" && setZooming(true)}
        onPointerLeave={() => setZooming(false)}
        onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart.current == null) return;
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
          touchStart.current = null;
        }}
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-card bg-muted"
      >
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt ?? name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          style={
            zooming
              ? { transformOrigin: `${origin.x}% ${origin.y}%`, transform: "scale(1.9)" }
              : undefined
          }
          className="object-cover transition-transform duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-none"
        />

        {!zooming && (
          <span className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1.5 rounded-pill bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur md:inline-flex">
            <ZoomIn className="h-3.5 w-3.5" aria-hidden />
            Hover to zoom
          </span>
        )}

        {shown.length > 1 && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-pill bg-background/90 px-3 py-1 text-xs font-medium backdrop-blur">
            {active + 1} / {shown.length}
          </span>
        )}
      </div>

      {shown.length > 1 && (
        <ul className="flex gap-3">
          {shown.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${shown.length}`}
                aria-current={i === active}
                className={cn(
                  "relative h-20 w-20 overflow-hidden rounded-control border-2 transition-colors",
                  i === active ? "border-primary" : "border-transparent hover:border-border"
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
