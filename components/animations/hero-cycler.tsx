"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Slide = { imageUrl: string; alt: string };

// Cycles through hero product images with a premium ease. Falls back to a
// static first image when prefers-reduced-motion is set, or when there is
// only one (or zero) images.
export function HeroCycler({
  slides,
  intervalMs = 5000,
}: {
  slides: Slide[];
  intervalMs?: number;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || slides.length <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      intervalMs
    );
    return () => clearInterval(id);
  }, [reduce, slides.length, intervalMs]);

  if (slides.length === 0) {
    return (
      <div className="grid h-full place-items-center">
        <div className="rounded-card bg-white/10 px-6 py-4 text-center text-sm text-muted-foreground">
          Add hero images in Admin → Homepage
        </div>
      </div>
    );
  }

  if (reduce || slides.length === 1) {
    const s = slides[0];
    return (
      <div className="relative h-full w-full">
        <Image
          src={s.imageUrl}
          alt={s.alt}
          fill
          priority
          sizes="(max-width:1024px) 100vw, 50vw"
          className="object-contain"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0, x: 60, rotate: -4 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          exit={{ opacity: 0, x: -60, rotate: 4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={slides[index].imageUrl}
            alt={slides[index].alt}
            fill
            priority={index === 0}
            sizes="(max-width:1024px) 100vw, 50vw"
            className="object-contain"
          />
        </motion.div>
      </AnimatePresence>

      {/* dots */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}`}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === index ? "bg-primary" : "bg-primary/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
