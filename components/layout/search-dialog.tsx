"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/utils/use-safe-reduced-motion";
import { Loader2, Search, X } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

type Suggestion = {
  slug: string;
  name: string;
  category: string | null;
  price: number;
  image: string | null;
};

/**
 * Header search. Opens an overlay, queries `/api/search` as you type and
 * offers the full results page on submit.
 *
 * Typing is debounced at 250 ms and every in-flight request is aborted when a
 * newer keystroke arrives, so a fast typist fires one query, not twelve.
 */
export function SearchDialog({ currency = "USD" }: { currency?: string }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const reduce = useSafeReducedMotion();

  // Focus the field on open, and hand focus back to the trigger on close.
  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement;
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // Cmd/Ctrl-K is the search shortcut people already expect.
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { results: Suggestion[] };
        setResults(data.results);
      } catch {
        // An aborted request is the normal case here, not an error worth showing.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [term]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = term.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search products"
        aria-haspopup="dialog"
        className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-muted"
      >
        <Search className="h-5 w-5" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <button
              type="button"
              aria-label="Close search"
              onClick={() => setOpen(false)}
              className="absolute inset-0 cursor-default bg-secondary/40 backdrop-blur-sm"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Search products"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl overflow-hidden rounded-card bg-background shadow-hover"
            >
              <form onSubmit={submit} className="flex items-center gap-3 border-b border-border px-5">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <input
                  ref={inputRef}
                  type="search"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search shoes, brands or categories…"
                  aria-label="Search term"
                  className="h-16 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Searching" />
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close search"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>

              <div className="max-h-[52vh] overflow-y-auto">
                {results.length > 0 ? (
                  <ul className="p-2">
                    {results.map((r) => (
                      <li key={r.slug}>
                        <Link
                          href={`/products/${r.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-4 rounded-control p-2.5 transition-colors hover:bg-muted"
                        >
                          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-muted">
                            {r.image && (
                              <Image src={r.image} alt="" fill sizes="56px" className="object-cover" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{r.name}</span>
                            {r.category && (
                              <span className="block text-xs text-muted-foreground">{r.category}</span>
                            )}
                          </span>
                          <span className="shrink-0 text-sm font-semibold">
                            {formatPrice(r.price, currency)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                    {term.trim().length < 2
                      ? "Type at least two characters to search."
                      : loading
                        ? "Searching…"
                        : `No matches for "${term.trim()}".`}
                  </p>
                )}
              </div>

              {term.trim().length >= 2 && (
                <div className="border-t border-border p-3">
                  <button
                    type="button"
                    onClick={submit}
                    className="w-full rounded-control bg-muted py-2.5 text-sm font-medium transition-colors hover:bg-border"
                  >
                    See all results for &ldquo;{term.trim()}&rdquo;
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
