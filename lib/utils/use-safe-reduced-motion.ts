"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * `prefers-reduced-motion`, but hydration-safe.
 *
 * The server has no media queries, so it always renders the full-motion markup.
 * If a component branched straight off `useReducedMotion()` the first client
 * render would disagree with the server, React would refuse to patch the
 * mismatched inline styles, and elements could be left stuck at `opacity: 0`.
 *
 * Reporting `false` until after mount keeps the first client render identical
 * to the server's; the real preference lands on the next commit, before any
 * animation has had a chance to run.
 */
export function useSafeReducedMotion(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted ? Boolean(reduce) : false;
}
