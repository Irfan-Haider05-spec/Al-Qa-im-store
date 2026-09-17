"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll-triggered entrance animations, done in CSS rather than with a motion
 * library.
 *
 * Three reasons this is not framer-motion:
 *
 *  1. **It cannot hide content.** The hidden state lives behind
 *     `[data-js="on"]` (set by an inline script in the root layout), so markup
 *     served to a crawler, or to a browser where the bundle failed, is visible
 *     with no inline `opacity: 0` to strip.
 *  2. **No hydration mismatch.** The server and the first client render emit
 *     identical markup; only a class is added later, which React is happy with.
 *  3. **No client JavaScript per element** beyond one shared IntersectionObserver
 *     — these wrap most sections on the homepage.
 *
 * Reduced motion is handled in `globals.css`: the transform is dropped and the
 * element is simply visible.
 */

/** One observer for every revealed element on the page, not one each. */
let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function observe(element: Element, onVisible: () => void) {
  if (typeof IntersectionObserver === "undefined") {
    onVisible();
    return () => {};
  }

  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callbacks.get(entry.target)?.();
        observer?.unobserve(entry.target);
        callbacks.delete(entry.target);
      }
    },
    { rootMargin: "0px 0px -60px 0px", threshold: 0.01 }
  );

  callbacks.set(element, onVisible);
  observer.observe(element);

  return () => {
    observer?.unobserve(element);
    callbacks.delete(element);
  };
}

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Already on screen at mount (above the fold): reveal on the next frame so
    // the transition still plays rather than snapping.
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }

    return observe(element, () => setShown(true));
  }, []);

  return { ref, shown };
}

type RevealProps = {
  children: ReactNode;
  /** Seconds before this element starts its transition. */
  delay?: number;
  className?: string;
};

export function FadeIn({ children, delay = 0, className }: RevealProps) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`reveal${shown ? " reveal-in" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Reveals its children one after another. The stagger is a transition delay per
 * item, so the whole group still costs a single observer entry.
 */
export function Stagger({
  children,
  className,
  step = 0.07,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`${shown ? "reveal-group-in " : ""}reveal-group${className ? ` ${className}` : ""}`}
      style={{ ["--reveal-step" as string]: `${step}s` }}
    >
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`reveal-item${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
