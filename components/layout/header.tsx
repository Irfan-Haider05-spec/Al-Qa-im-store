"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Heart, Menu, ShoppingBag, User, X } from "lucide-react";
import { SearchDialog } from "@/components/layout/search-dialog";
import { Logo } from "@/components/brand/logo";
import { useSafeReducedMotion } from "@/lib/utils/use-safe-reduced-motion";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Order", href: "/account/orders" },
  { label: "Contact", href: "/contact" },
];

export type HeaderCategory = { slug: string; name: string; imageUrl: string | null };

/**
 * The site header: a thin announcement line, then the bar itself.
 *
 * It is always on the dark brand surface — the hero it sits over is dark too,
 * so on the homepage it starts transparent and fills in once you scroll. The
 * announcement line collapses away on scroll so it costs nothing after the
 * first screen.
 */
export function Header({
  cartCount = 0,
  storeName,
  logoUrl,
  categories = [],
  signedIn = false,
  currency = "USD",
  announcement,
}: {
  cartCount?: number;
  storeName: string;
  logoUrl?: string | null;
  categories?: HeaderCategory[];
  signedIn?: boolean;
  currency?: string;
  announcement?: string;
}) {
  const [open, setOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const collectionsRef = useRef<HTMLDivElement>(null);
  const reduce = useSafeReducedMotion();

  const overHero = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Any navigation closes whatever was open.
  useEffect(() => {
    setOpen(false);
    setCollectionsOpen(false);
  }, [pathname]);

  // Mobile drawer: Escape closes, focus moves in, the page behind stops scrolling.
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

  // Collections panel: Escape or a click anywhere outside closes it.
  useEffect(() => {
    if (!collectionsOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCollectionsOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!collectionsRef.current?.contains(e.target as Node)) setCollectionsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [collectionsOpen]);

  const solid = !overHero || scrolled || collectionsOpen;

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      {announcement && (
        <div
          className={cn(
            "surface-dark overflow-hidden border-b border-white/10 text-center transition-[max-height,opacity] duration-300",
            scrolled ? "max-h-0 opacity-0" : "max-h-10 opacity-100"
          )}
        >
          <p className="eyebrow truncate px-4 py-2 text-[0.6rem] tracking-[0.14em] text-gold-light sm:text-[0.66rem] sm:tracking-[0.26em]">
            {announcement}
          </p>
        </div>
      )}

      <div
        className={cn(
          "surface-dark transition-[background-color,box-shadow,backdrop-filter] duration-300",
          solid
            ? "bg-ink/95 shadow-[0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-md"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex max-w-content items-center justify-between gap-6 px-5 py-3.5 sm:px-8 lg:px-12">
          <Link href="/" aria-label={`${storeName} — home`} className="shrink-0">
            <Logo logoUrl={logoUrl} name={storeName} tone="light" />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
            {NAV.slice(0, 2).map((item) => (
              <NavLink key={item.href} href={item.href} pathname={pathname}>
                {item.label}
              </NavLink>
            ))}

            {categories.length > 0 && (
              <div ref={collectionsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setCollectionsOpen((v) => !v)}
                  aria-expanded={collectionsOpen}
                  aria-controls="collections-panel"
                  className={cn(
                    "inline-flex items-center gap-1 text-[0.8rem] font-medium uppercase tracking-[0.16em] transition-colors hover:text-gold-light",
                    pathname.startsWith("/category") ? "text-gold-light" : "text-ivory/80"
                  )}
                >
                  Collections
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", collectionsOpen && "rotate-180")}
                    aria-hidden
                  />
                </button>

                <AnimatePresence>
                  {collectionsOpen && (
                    <motion.div
                      id="collections-panel"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="surface-dark absolute left-1/2 top-full mt-5 w-[min(44rem,80vw)] -translate-x-1/2 rounded-card border border-white/10 p-5 shadow-hover"
                    >
                      <ul className="grid grid-cols-3 gap-3">
                        {categories.map((c) => (
                          <li key={c.slug}>
                            <Link
                              href={`/category/${c.slug}`}
                              className="group block overflow-hidden rounded-control"
                            >
                              <span className="relative block aspect-[4/3] overflow-hidden bg-white/5">
                                {c.imageUrl && (
                                  <Image
                                    src={c.imageUrl}
                                    alt=""
                                    fill
                                    sizes="220px"
                                    className="object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                                  />
                                )}
                                <span className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                                <span className="absolute bottom-2.5 left-3 font-display text-base text-ivory">
                                  {c.name}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/shop"
                        className="eyebrow mt-4 inline-block text-gold-light hover:text-ivory"
                      >
                        Shop everything →
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {NAV.slice(2).map((item) => (
              <NavLink key={item.href} href={item.href} pathname={pathname}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 text-ivory sm:gap-1.5">
            <SearchDialog currency={currency} />

            <IconLink href="/account/wishlist" label="Wishlist" className="hidden sm:grid">
              <Heart className="h-[1.15rem] w-[1.15rem]" aria-hidden />
            </IconLink>

            <IconLink
              href={signedIn ? "/account" : "/login"}
              label={signedIn ? "Your account" : "Sign in"}
              className="hidden md:grid"
            >
              <User className="h-[1.15rem] w-[1.15rem]" aria-hidden />
            </IconLink>

            <IconLink
              href="/cart"
              label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart, empty"}
              className="relative"
            >
              <ShoppingBag className="h-[1.15rem] w-[1.15rem]" aria-hidden />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold leading-none text-ink">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </IconLink>

            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-white/10 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 cursor-default bg-ink/70 backdrop-blur-sm"
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
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="surface-dark absolute right-0 top-0 flex h-full w-[22rem] max-w-[88%] flex-col overflow-y-auto border-l border-white/10 p-6"
            >
              <div className="mb-10 flex items-center justify-between">
                <Logo logoUrl={logoUrl} name={storeName} size="sm" />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav aria-label="Mobile">
                <ul className="space-y-1">
                  {[
                    ...NAV,
                    { label: "Wishlist", href: "/account/wishlist" },
                    { label: signedIn ? "My account" : "Sign in", href: signedIn ? "/account" : "/login" },
                  ].map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        prefetch={prefetchFor(item.href)}
                        className="block border-b border-white/10 py-4 font-display text-2xl text-ivory transition-colors hover:text-gold-light"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {categories.length > 0 && (
                <>
                  <p className="eyebrow mt-10 text-gold-light">Collections</p>
                  <ul className="mt-4 grid grid-cols-2 gap-2">
                    {categories.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/category/${c.slug}`}
                          className="block rounded-control border border-white/10 px-3 py-2.5 text-sm text-ivory/85 transition-colors hover:border-gold/60 hover:text-ivory"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <Link
                href="/cart"
                className="mt-auto flex items-center justify-between rounded-pill bg-gold-gradient px-6 py-3.5 text-sm font-semibold text-ink"
              >
                View cart
                <span>{cartCount > 0 ? `${cartCount} items` : "Empty"}</span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({
  href,
  pathname,
  children,
}: {
  href: string;
  pathname: string;
  children: React.ReactNode;
}) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      prefetch={prefetchFor(href)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative text-[0.8rem] font-medium uppercase tracking-[0.16em] transition-colors hover:text-gold-light",
        active ? "text-gold-light" : "text-ivory/80"
      )}
    >
      {children}
      {active && (
        <span className="absolute -bottom-2 left-1/2 h-px w-5 -translate-x-1/2 bg-gold" />
      )}
    </Link>
  );
}

/**
 * Account pages redirect guests to sign in, so prefetching them for a visitor
 * who isn't signed in only fetches a redirect. They load on click instead.
 */
const prefetchFor = (href: string) => (href.startsWith("/account") ? false : undefined);

function IconLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetchFor(href)}
      aria-label={label}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-white/10 hover:text-gold-light",
        className
      )}
    >
      {children}
    </Link>
  );
}
