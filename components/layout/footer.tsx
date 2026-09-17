import Link from "next/link";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { prisma } from "@/lib/db/prisma";

// Static link groups that don't depend on the catalog.
const SHORTCUTS = [
  { label: "Shop All", href: "/shop" },
  { label: "New In", href: "/shop?sort=newest" },
  { label: "On Sale", href: "/shop?onSale=1" },
];

const COMPANY = [
  { label: "About us", href: "/about" },
  { label: "Contact us", href: "/contact" },
  { label: "Payment Options", href: "/about#payments" },
  { label: "Track Order", href: "/account/orders" },
  { label: "Size Charts", href: "/about#sizes" },
];

const LEGAL = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms And Conditions", href: "/legal/terms" },
  { label: "Cookie settings", href: "/legal/cookies" },
  { label: "Imprint", href: "/legal/imprint" },
];

export async function Footer() {
  // Pull whatever categories exist — shoes today, trousers/shirts tomorrow.
  let categories: { slug: string; name: string }[] = [];
  let storeName = "Shoe Express";
  let socials: { instagram?: string; facebook?: string; youtube?: string } = {};
  try {
    const [cats, settings] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
        take: 8,
      }),
      prisma.siteSettings.findFirst(),
    ]);
    categories = cats;
    if (settings?.storeName) storeName = settings.storeName;
    socials = (settings?.socials ?? {}) as typeof socials;
  } catch {
    /* pre-seed fallback */
  }

  const socialLinks = [
    { Icon: Instagram, label: "Instagram", href: socials.instagram || "#" },
    { Icon: Facebook, label: "Facebook", href: socials.facebook || "#" },
    { Icon: Youtube, label: "YouTube", href: socials.youtube || "#" },
  ];

  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="mx-auto max-w-content px-5 py-14 sm:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Shop shortcuts */}
          <div>
            <h3 className="font-display text-lg font-semibold">Shop</h3>
            <ul className="mt-4 space-y-2 text-sm text-accent-foreground/85">
              {SHORTCUTS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dynamic categories */}
          <div>
            <h3 className="font-display text-lg font-semibold">Categories</h3>
            <ul className="mt-4 space-y-2 text-sm text-accent-foreground/85">
              {categories.length > 0 ? (
                categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/category/${c.slug}`}
                      className="hover:text-white"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link href="/shop" className="hover:text-white">
                    Shop All
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-display text-lg font-semibold">Company</h3>
            <ul className="mt-4 space-y-2 text-sm text-accent-foreground/85">
              {COMPANY.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-display text-lg font-semibold">Follow us</h3>
            <div className="mt-4 flex gap-3">
              {socialLinks.map(({ Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/20 hover:bg-white/30"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-6">
          <p className="text-sm text-accent-foreground/75">
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-accent-foreground/75">
            {LEGAL.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
