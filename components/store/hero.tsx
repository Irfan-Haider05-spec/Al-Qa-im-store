"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/utils/use-safe-reduced-motion";

export type HeroSlide = {
  imageUrl: string;
  alt: string;
  href: string;
  label: string | null;
  durationMs: number;
};

export type HeroContent = {
  heading: string;
  subheading: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
};

/**
 * The brand circle's box, shared by the circle and the orbit so the shoes can
 * never drift off its edge.
 *
 * Measured from the reference: the circle is roughly as tall as the hero
 * itself, its centre sits at ~83% across, and about a seventh of it runs past
 * the right edge of the viewport. Sizing it by the smaller of width and height
 * keeps it nearly full-bleed vertically on a laptop without ballooning on an
 * ultrawide.
 */
const ANCHOR = [
  "aspect-square -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2",
  // Small screens stack: the circle is centred in its own band below the copy.
  "w-[86vw] sm:w-[66vw]",
  "lg:left-[83%] lg:w-[min(58vw,84vh)]",
].join(" ");

/**
 * Where a shoe sits on the orbit, as a share of the circle's box.
 *
 * Shoes travel the circle's left arc: in from below, out through the middle at
 * full size, away past the top. The two in transit are about half the size of
 * the hero shoe and are clipped by the section edge, exactly as they are in the
 * reference frames.
 */
const STOPS = {
  entering: { x: "-8%", y: "58%", scale: 0.3, rotate: 18 },
  active: { x: "-40%", y: "-2%", scale: 0.7, rotate: -24 },
  leaving: { x: "-14%", y: "-58%", scale: 0.32, rotate: -52 },
  parkedTop: { x: "-10%", y: "-88%", scale: 0.26, rotate: -70 },
  parkedBottom: { x: "-5%", y: "88%", scale: 0.24, rotate: 36 },
};

type Stop = keyof typeof STOPS;

/** Which stop a slide occupies, given how far it is behind the active one. */
function stopFor(offset: number, total: number): Stop {
  if (offset === 0) return "active";
  if (offset === 1) return "entering";
  if (offset === total - 1) return "leaving";
  if (offset === total - 2) return "parkedTop";
  return "parkedBottom";
}

/**
 * The homepage hero.
 *
 * Two things move the shoes. A timer advances them one stop around the circle,
 * and scroll position turns the whole orbit further while the circle drifts, so
 * the composition keeps working as the hero leaves the screen. Each shoe
 * counter-rotates against the orbit so it arcs along the path without
 * cartwheeling.
 *
 * The stops themselves are plain inline transforms with CSS transitions rather
 * than JavaScript-driven animation: the first paint is already composed, the
 * browser owns the interpolation, and `motion-reduce` removes the movement
 * without a second code path that could strand a shoe mid-transform.
 */
export function Hero({
  content,
  slides,
}: {
  content: HeroContent;
  slides: HeroSlide[];
}) {
  const reduce = useSafeReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Scroll progress, measured in the handler rather than with `useScroll`:
  // that reads the element once on mount, and any later layout change leaves
  // it stuck reporting zero. rAF keeps this to one read a frame.
  const orbitSpin = useMotionValue(0);
  const counterSpin = useTransform(orbitSpin, (deg: number) => -deg);
  const circleY = useMotionValue(0);
  const circleScale = useMotionValue(1);
  const textY = useMotionValue(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (reduce || !section) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const progress = Math.min(
        1,
        Math.max(0, -rect.top / Math.max(1, rect.height))
      );
      orbitSpin.set(progress * 26);
      circleY.set(progress * 90);
      circleScale.set(1 + progress * 0.1);
      textY.set(progress * -40);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduce, orbitSpin, circleY, circleScale, textY]);

  // Advance around the circle. Pauses on hover or focus, and while the tab is
  // hidden — a backgrounded tab throttles timers and resumes mid-transition.
  useEffect(() => {
    if (reduce || paused || slides.length <= 1) return;
    const id = setTimeout(
      () => setActive((i) => (i + 1) % slides.length),
      slides[active]?.durationMs ?? 4200
    );
    return () => clearTimeout(id);
  }, [active, paused, reduce, slides]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // "Men's collection" — the first word carries the brand colour.
  const [firstWord, ...restWords] = content.subheading.split(" ");

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden pb-14 pt-24 sm:pt-28 lg:min-h-[88vh] lg:pb-0"
    >
      {/* ------------------------------------------------------- copy -- */}
      <motion.div
        style={reduce ? undefined : { y: textY }}
        className="relative z-10 mx-auto max-w-content px-6 sm:px-10 lg:flex lg:min-h-[74vh] lg:items-center lg:px-12"
      >
        <div className="max-w-xl lg:max-w-[38rem]">
          <h1 className="font-display text-[clamp(2.4rem,5.4vw,4.75rem)] font-black uppercase leading-[0.98] tracking-[-0.01em]">
            {content.heading}
          </h1>

          <p className="mt-3 text-[clamp(1.4rem,2.6vw,2.4rem)] font-semibold leading-tight">
            <span className="text-primary">{firstWord}</span>
            {restWords.length > 0 && <span> {restWords.join(" ")}</span>}
          </p>

          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            {content.description}
          </p>

          <Link
            href={content.ctaUrl}
            className="mt-10 inline-flex h-14 items-center justify-center gap-3 rounded-pill bg-primary px-9 text-base font-medium text-primary-foreground shadow-card transition-all hover:-translate-y-0.5 hover:bg-primary-deep"
          >
            {content.ctaLabel}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </motion.div>

      {/* The composition sits in normal flow below the copy on small screens —
          overlapping it there buries the headline — and becomes an absolute
          backdrop the copy sits on top of from lg up. */}
      <div className="relative mt-10 h-[20rem] sm:h-[26rem] lg:absolute lg:inset-0 lg:mt-0 lg:h-auto">
        {/* Centring lives on this static wrapper, never on the animated child:
            Framer writes its own inline `transform`, which would silently wipe
            out a Tailwind `-translate-y-1/2` and drop the circle out of place. */}
        <div aria-hidden className={`pointer-events-none absolute -z-10 ${ANCHOR}`}>
          <motion.div
            style={reduce ? undefined : { y: circleY, scale: circleScale }}
            className="h-full w-full rounded-full bg-primary"
          >
            {/* The white disc bitten out of the circle's right side. */}
            <span className="absolute right-[-6%] top-1/2 block h-[34%] w-[34%] -translate-y-1/2 rounded-full bg-background" />
          </motion.div>
        </div>

        {/* Loose accent dots, drifting independently of the orbit. */}
        <span
          aria-hidden
          className="float pointer-events-none absolute left-[54%] top-[14%] -z-10 h-6 w-6 rounded-full bg-primary sm:h-9 sm:w-9 lg:left-[60%]"
          style={{ ["--float-duration" as string]: "6s", ["--float-distance" as string]: "-16px" }}
        />
        <span
          aria-hidden
          className="float pointer-events-none absolute left-[44%] top-[76%] -z-10 h-12 w-12 rounded-full bg-primary/90 sm:h-16 sm:w-16 lg:left-[49%]"
          style={{ ["--float-duration" as string]: "7.5s", ["--float-distance" as string]: "15px" }}
        />

        {slides.length > 0 && (
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
            className={`pointer-events-none absolute ${ANCHOR}`}
          >
            {/* Nudged right on small screens so the hero shoe lands centred
                rather than pushed off-frame by its desktop offset. */}
            <div className="absolute inset-0 translate-x-[38%] lg:translate-x-0">
              <motion.div
                style={reduce ? undefined : { rotate: orbitSpin }}
                className="absolute inset-0"
              >
                {slides.map((slide, i) => {
                  const offset = (i - active + slides.length) % slides.length;
                  const stop = stopFor(offset, slides.length);
                  const isActive = stop === "active";
                  const inTransit = stop === "entering" || stop === "leaving";
                  const { x, y, scale, rotate } = STOPS[stop];
                  const opacity = isActive || inTransit ? 1 : 0;

                  return (
                    <div
                      key={slide.imageUrl}
                      // Below lg only the hero shoe shows. There is no room for
                      // the two in transit in a stacked layout — they end up
                      // over the headline — so the conveyor is a desktop
                      // flourish.
                      className={[
                        "absolute inset-0 will-change-transform",
                        "transition-[transform,opacity] duration-[1100ms]",
                        "ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                        isActive ? "" : "hidden lg:block",
                      ].join(" ")}
                      style={{
                        transform: `translate(${x}, ${y}) scale(${scale})`,
                        opacity,
                      }}
                    >
                      {/* Cancels the scroll-driven orbit turn, so the shoe
                          follows the arc while staying the right way up. */}
                      <motion.div
                        className="absolute inset-0"
                        style={reduce ? undefined : { rotate: counterSpin }}
                      >
                        <div
                          className={[
                            "absolute inset-0 transition-transform duration-[1100ms]",
                            "ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                          ].join(" ")}
                          style={{ transform: `rotate(${rotate}deg)` }}
                        >
                          <Link
                            href={slide.href}
                            // Only the shoe in the hero position is reachable;
                            // the ones in transit are decoration and would
                            // otherwise add four links to the tab order.
                            tabIndex={isActive ? 0 : -1}
                            aria-hidden={!isActive}
                            className={[
                              "relative block h-full w-full",
                              isActive ? "pointer-events-auto" : "pointer-events-none",
                            ].join(" ")}
                          >
                            <Image
                              src={slide.imageUrl}
                              alt={isActive ? slide.alt : ""}
                              fill
                              priority={i === 0}
                              // The shoe never fills its box — it is scaled to
                              // 0.72 of the circle at most. Overstating this
                              // made Next fetch the 3840px source of a
                              // half-megabyte PNG.
                              sizes="(max-width: 640px) 62vw, (max-width: 1024px) 48vw, 38vw"
                              className="object-contain drop-shadow-[0_30px_45px_rgb(var(--secondary)/0.28)]"
                            />
                          </Link>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
