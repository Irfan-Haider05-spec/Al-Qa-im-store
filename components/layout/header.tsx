"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
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
}: {
  cartCount?: number;
  storeName?: string;
  categories?: Category[];
}) {
  const [open, setOpen] = useState(false);

  // Split store name into two parts for the two-tone wordmark.
  const parts = storeName.trim().split(" ");
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : storeName;
  const last = parts.length > 1 ? parts[parts.length - 1] : "";

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-content items-center justify-between px-5 py-5 sm:px-8">
        {/* Logo */}
        <Link href="/" className="font-display text-2xl font-bold tracking-tight">
          {last ? (
            <>
              {first}
              <span className="text-primary">{last}</span>
            </>
          ) : (
            <span className="text-primary">{storeName}</span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            Log in
          </Link>
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-4">
          <button aria-label="Search" className="hidden md:inline-flex">
            <Search className="h-5 w-5" />
          </button>
          <Link href="/cart" aria-label="Cart" className="relative">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            aria-label="Open menu"
            aria-expanded={open}
            className="md:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        {/* backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-secondary/40 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />
        {/* panel */}
        <nav
          className={cn(
            "absolute right-0 top-0 h-full w-72 max-w-[80%] bg-background p-6 shadow-hover transition-transform",
            open ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="font-display text-xl font-bold">Menu</span>
            <button aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <ul className="space-y-1">
            {[...NAV, { label: "Log in", href: "/login" }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-control px-3 py-3 text-base font-medium hover:bg-muted"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {categories.length > 0 && (
            <>
              <p className="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categories
              </p>
              <ul className="mt-2 space-y-1">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/category/${c.slug}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-control px-3 py-2.5 text-sm hover:bg-muted"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
