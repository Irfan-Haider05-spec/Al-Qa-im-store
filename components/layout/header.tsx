"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/utils/use-safe-reduced-motion";
import { Heart, LogIn, Menu, ShoppingBag, User, X } from "lucide-react";
import { SearchDialog } from "@/components/layout/search-dialog";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Order", href: "/account/orders" },
  { label: "Contact", href: "/contact" },
];

type Category = { slug: string; name: string };

export function Header({
  cartCount = 0,
  storeName = "Shoe Express",
  categories = [],
  signedIn = false,
  currency = "USD",
}: {
  cartCount?: number;
  storeName?: string;
  categories?: Category[];
  signedIn?: boolean;
  currency?: string;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useSafeReducedMotion();

  // The header floats over the hero on the homepage and gets a solid backing
  // everywhere else — and once you scroll away from the top.
  const overlay = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer on navigation — otherwise it stays open over the new page.
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes; focus moves into the panel and the page behind stops scrolling.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const parts = storeName.trim().split(" ");
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : storeName;
  const last = parts.length > 1 ? parts[parts.length - 1] : "";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        overlay && !scrolled
          // Over the hero the bar picks up the pale brand tint the reference
          // uses, rather than disappearing into the white.
          ? "bg-primary/[0.18] backdrop-blur-[2px]"
          : "border-b border-border bg-background/85 backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-display text-2xl font-bold uppercase tracking-tight"
        >
          {last ? (
            <>
              {first}
              <span className="text-primary">{last}</span>
            </>
          ) : (
            <span className="text-primary">{storeName}</span>
          )}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative text-sm font-medium transition-colors hover:text-primary",
                  active ? "text-primary" : "text-foreground/80"
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-pill bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <SearchDialog currency={currency} />

          <Link
            href="/account/wishlist"
            aria-label="Wishlist"
            className="hidden h-9 w-9 place-items-center rounded-full transition-colors hover:bg-muted sm:grid"
          >
            <Heart className="h-5 w-5" aria-hidden />
          </Link>

          <Link
            href={signedIn ? "/account" : "/login"}
            aria-label={signedIn ? "Your account" : "Log in"}
            className="hidden h-9 w-9 place-items-center rounded-full transition-colors hover:bg-muted md:grid"
          >
            {signedIn ? (
              <User className="h-5 w-5" aria-hidden />
            ) : (
              <LogIn className="h-5 w-5" aria-hidden />
            )}
          </Link>

          <Link
            href="/cart"
            aria-label={
              cartCount > 0 ? `Cart, ${cartCount} items` : "Cart, empty"
            }
            className="relative grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-muted"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-accent-foreground">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-muted md:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 cursor-default bg-secondary/50 backdrop-blur-sm"
            />

            <motion.div
              ref={panelRef}
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-0 flex h-full w-80 max-w-[85%] flex-col overflow-y-auto bg-background p-6 shadow-hover"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="font-display text-xl font-bold uppercase">Menu</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav aria-label="Mobile">
                <ul className="space-y-1">
                  {NAV.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block rounded-control px-3 py-3 text-base font-medium transition-colors hover:bg-muted"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/account/wishlist"
                      className="block rounded-control px-3 py-3 text-base font-medium transition-colors hover:bg-muted"
                    >
                      Wishlist
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/cart"
                      className="flex items-center justify-between rounded-control px-3 py-3 text-base font-medium transition-colors hover:bg-muted"
                    >
                      Cart
                      {cartCount > 0 && (
                        <span className="rounded-pill bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={signedIn ? "/account" : "/login"}
                      className="block rounded-control px-3 py-3 text-base font-medium transition-colors hover:bg-muted"
                    >
                      {signedIn ? "My account" : "Log in"}
                    </Link>
                  </li>
                </ul>
              </nav>

              {categories.length > 0 && (
                <>
                  <p className="mt-7 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Categories
                  </p>
                  <ul className="mt-2 space-y-1">
                    {categories.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/category/${c.slug}`}
                          className="block rounded-control px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
