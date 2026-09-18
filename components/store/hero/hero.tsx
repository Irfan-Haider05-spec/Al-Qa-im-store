"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { formatPrice } from "@/lib/utils/format";
import { useSafeReducedMotion } from "@/lib/utils/use-safe-reduced-motion";
import { cn } from "@/lib/utils/cn";

// three.js is only fetched on the homepage, after hydration. The poster below
// is what paints first — and what stays if WebGL is unavailable.
const HeroStage = dynamic(() => import("./hero-stage"), { ssr: false });

export type HeroSlide = {
  imageUrl: string;
  alt: string;
  durationMs: number;
  product: {
    name: string;
    slug: string;
    price: number;
    compareAt: number | null;
    category: string | null;
  } | null;
};

export type HeroContent = {
  heading: string;
  subheading: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
};

const DEFAULT_HOLD_MS = 3200;

/**
 * The homepage hero: copy on the left, the product showcase on the right.
 *
 * The timer lives here rather than in the WebGL scene so the slide counter,
 * the progress line, the product caption and the scene can never disagree
 * about which shoe is showing — and so the showcase still rotates (as a
 * cross-fade between posters) on a device where WebGL is unavailable.
 *
 * Accessibility: auto-advancing content has a visible pause control (WCAG
 * 2.2.2), prev/next buttons, and a live region announcing the product. Under
 * `prefers-reduced-motion` the showcase still rotates — the setting asks for
 * less movement, not a frozen page — but shoes cross-fade in place and the
 * drift, parallax and scroll choreography are switched off.
 */
export function Hero({
  content,
  slides,
  currency = "USD",
}: {
  content: HeroContent;
  slides: HeroSlide[];
  currency?: string;
}) {
  const gentle = useSafeReducedMotion();
  // `active` is the slide asked for; `shown` is the one the 3D stage is
  // actually displaying. They differ only while a shoe's image is still
  // loading, and the caption, counter and timer follow what is on screen.
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [stageReady, setStageReady] = useState(false);
  // True once the WebGL stage has either shown its first shoe or given up
  // (no WebGL), so the poster carousel takes over.
  const [stageSettled, setStageSettled] = useState(false);
  const [wide, setWide] = useState(true);

  const paused = userPaused || tabHidden;
  const count = slides.length;
  const displayed = stageReady ? shown : active;
  const catchingUp = stageReady && shown !== active;
  const hold = slides[displayed]?.durationMs || DEFAULT_HOLD_MS;

  // Stable identity: the scene is rebuilt whenever this array changes.
  const stageSlides = useMemo(() => slides.map((s) => ({ imageUrl: s.imageUrl })), [slides]);

  const go = useCallback(
    (delta: number) => setActive((i) => (i + delta + count) % count),
    [count]
  );

  // The first slide's clock starts when it is actually on screen: on a slow
  // connection the 3D stage can take a few seconds to load, and a timer that
  // started at mount would skip the first shoe the moment it appeared.
  useEffect(() => {
    if (paused || count <= 1 || !stageSettled || catchingUp) return;
    const id = window.setTimeout(() => go(1), hold);
    return () => window.clearTimeout(id);
  }, [displayed, paused, count, hold, go, stageSettled, catchingUp]);

  // Safety net: never wait on the stage for more than a few seconds.
  useEffect(() => {
    const id = window.setTimeout(() => setStageSettled(true), 6000);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const product = slides[displayed]?.product ?? null;
  const [firstWord, ...restWords] = content.subheading.split(" ");

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured products"
      className="surface-dark relative isolate overflow-hidden lg:min-h-[100svh]"
      data-hero-active={active}
      data-hero-shown={displayed}
      data-hero-ready={stageReady}
    >
      {/* Backdrop: a warm pool of light on the right, a vignette at the edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_70%_45%,rgb(201_161_74/0.16),transparent_70%),radial-gradient(120%_90%_at_50%_120%,rgb(0_0_0/0.9),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
      />

      <div className="mx-auto grid max-w-content items-center gap-6 px-5 pb-10 pt-32 sm:px-8 lg:min-h-[100svh] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-12 lg:pb-16 lg:pt-28">
        {/* ------------------------------------------------------- copy -- */}
        <div className="relative z-10 max-w-xl">
          <p className="eyebrow flex items-center gap-3 text-gold-light">
            <span className="h-px w-8 bg-gold/70" aria-hidden />
            New season · {new Date().getFullYear()}
          </p>

          <h1 className="mt-6 font-display text-[clamp(3rem,7.4vw,6.6rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-ivory">
            {content.heading}
          </h1>

          <p className="mt-3 font-display text-[clamp(1.6rem,3vw,2.6rem)] italic leading-tight">
            <span className="text-gold-gradient">{firstWord}</span>
            {restWords.length > 0 && <span className="text-ivory/85"> {restWords.join(" ")}</span>}
          </p>

          <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-ivory/65">
            {content.description}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link
              href={content.ctaUrl}
              className="group inline-flex h-14 items-center gap-3 rounded-pill bg-gold-gradient px-8 text-sm font-semibold uppercase tracking-[0.14em] text-ink shadow-gold transition-transform duration-300 hover:-translate-y-0.5"
            >
              {content.ctaLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <Link
              href="/shop?sort=newest"
              className="text-sm font-medium uppercase tracking-[0.14em] text-ivory/80 underline decoration-gold/50 underline-offset-8 transition-colors hover:text-gold-light"
            >
              New arrivals
            </Link>
          </div>

          {/* Shoppable caption for whichever shoe is on stage. */}
          {product && (
            <div aria-live="polite" className="mt-12 hidden lg:block">
              <Link
                key={product.slug}
                href={`/products/${product.slug}`}
                className="group inline-flex items-center gap-4 rounded-card border border-white/10 bg-white/[0.03] px-5 py-3.5 backdrop-blur-sm transition-colors hover:border-gold/50 motion-safe:animate-[hero-caption_600ms_cubic-bezier(0.22,1,0.36,1)]"
              >
                <span>
                  <span className="eyebrow block text-[0.6rem] text-gold-light/80">
                    Now showing{product.category ? ` · ${product.category}` : ""}
                  </span>
                  <span className="mt-1 block font-display text-lg text-ivory">{product.name}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-semibold text-ivory">
                    {formatPrice(product.price, currency)}
                  </span>
                  {product.compareAt && product.compareAt > product.price && (
                    <span className="block text-xs text-ivory/45 line-through">
                      {formatPrice(product.compareAt, currency)}
                    </span>
                  )}
                </span>
                <ArrowRight className="h-4 w-4 text-gold-light transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
          )}
        </div>

        {/* -------------------------------------------------- showcase -- */}
        <div className="relative h-[24rem] sm:h-[30rem] lg:absolute lg:inset-0 lg:h-auto">
          {count > 0 ? (
            <>
              {/* Poster: server-rendered, paints first, and is the fallback
                  for devices without WebGL — it cross-fades on its own. */}
              <div
                aria-hidden={stageReady}
                className={cn(
                  "pointer-events-none absolute inset-0 transition-opacity duration-300",
                  stageReady ? "opacity-0" : "opacity-100"
                )}
              >
                <PosterRings />
                {slides.map((slide, i) => (
                  <div
                    key={slide.imageUrl}
                    className={cn(
                      "absolute inset-y-[18%] left-[12%] right-[12%] transition-opacity duration-700 lg:inset-y-[24%] lg:left-[54%] lg:right-[6%]",
                      i === active ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <Image
                      src={slide.imageUrl}
                      alt={i === active ? slide.alt : ""}
                      fill
                      priority={i === 0}
                      sizes="(max-width: 1024px) 80vw, 42vw"
                      className="object-contain drop-shadow-[0_30px_40px_rgb(0_0_0/0.6)]"
                    />
                  </div>
                ))}
              </div>

              <HeroStage
                slides={stageSlides}
                active={active}
                paused={paused}
                gentle={gentle}
                align={wide ? "right" : "center"}
                onReady={() => {
                  setStageReady(true);
                  setStageSettled(true);
                }}
                onUnavailable={() => setStageSettled(true)}
                onShown={setShown}
              />
            </>
          ) : (
            // No slides configured yet: the monogram carries the space.
            <div className="grid h-full place-items-center">
              <LogoMark className="h-auto w-[min(70%,26rem)] opacity-90" />
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- controls -- */}
      {count > 1 && (
        <div className="relative z-10 mx-auto flex max-w-content items-center gap-5 px-5 pb-10 sm:px-8 lg:absolute lg:bottom-10 lg:right-0 lg:w-auto lg:px-12 lg:pb-0">
          <span className="font-display text-sm tabular-nums text-ivory/80">
            <span className="text-gold-light">{String(displayed + 1).padStart(2, "0")}</span>
            <span className="mx-2 text-ivory/30">/</span>
            {String(count).padStart(2, "0")}
          </span>

          {/* Progress line for the current slide. Keyed so it restarts. */}
          <span className="relative h-px w-24 overflow-hidden bg-white/15 sm:w-32" aria-hidden>
            <span
              key={`${displayed}-${paused}-${catchingUp}`}
              className="absolute inset-y-0 left-0 bg-gold"
              style={{
                width: paused || catchingUp ? "0%" : undefined,
                animation: paused || catchingUp ? "none" : `hero-progress ${hold}ms linear forwards`,
              }}
            />
          </span>

          <div className="flex items-center gap-1">
            <ControlButton label="Previous product" onClick={() => go(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </ControlButton>
            <ControlButton
              label={userPaused ? "Play showcase" : "Pause showcase"}
              onClick={() => setUserPaused((p) => !p)}
              pressed={userPaused}
            >
              {userPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </ControlButton>
            <ControlButton label="Next product" onClick={() => go(1)}>
              <ChevronRight className="h-4 w-4" />
            </ControlButton>
          </div>
        </div>
      )}

      {/* Scroll cue */}
      <div aria-hidden className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex">
        <span className="eyebrow text-[0.6rem] text-ivory/40">Scroll</span>
        <span className="relative h-10 w-px overflow-hidden bg-white/10">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-gold motion-safe:animate-[hero-scroll_2.2s_ease-in-out_infinite]" />
        </span>
      </div>
    </section>
  );
}

function ControlButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-ivory/80 transition-colors hover:border-gold/60 hover:text-gold-light"
    >
      {children}
    </button>
  );
}

/**
 * The gold rings, drawn in SVG for the poster so the first paint (and the
 * no-WebGL fallback) already has the composition's shape.
 */
function PosterRings() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 600"
      className="absolute left-1/2 top-1/2 h-[92%] -translate-x-1/2 -translate-y-1/2 lg:left-[71%] lg:h-[78%]"
    >
      <defs>
        <linearGradient id="poster-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7dc93" />
          <stop offset="0.5" stopColor="#d9ab52" />
          <stop offset="1" stopColor="#9c7430" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#poster-gold)">
        <ellipse cx="300" cy="300" rx="235" ry="70" strokeWidth="3" transform="rotate(-8 300 300)" />
        <ellipse cx="300" cy="300" rx="275" ry="120" strokeWidth="1.6" opacity="0.8" transform="rotate(14 300 300)" />
        <ellipse cx="300" cy="300" rx="290" ry="40" strokeWidth="1" opacity="0.6" transform="rotate(-20 300 300)" />
      </g>
    </svg>
  );
}
