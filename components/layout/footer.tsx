import Link from "next/link";
import { Instagram, Facebook, Youtube, Mail, Phone } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getSiteSettings } from "@/lib/settings/site";

const PRODUCTS = [
  { label: "Shop all", href: "/shop" },
  { label: "New in", href: "/shop?sort=newest" },
  { label: "Weekly pick", href: "/#popular" },
  { label: "On sale", href: "/shop?onSale=1" },
];

const COMPANY = [
  { label: "About us", href: "/about" },
  { label: "Contact us", href: "/contact" },
  { label: "Payment options", href: "/about#payments" },
  { label: "Track order", href: "/account/orders" },
  { label: "Size charts", href: "/about#sizes" },
  { label: "Support", href: "/contact" },
];

const LEGAL = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms & Conditions", href: "/legal/terms" },
  { label: "Cookie settings", href: "/legal/cookies" },
  { label: "Imprint", href: "/legal/imprint" },
];

export async function Footer() {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    prisma.category
      .findMany({
        where: { isActive: true },
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
        take: 8,
      })
      .catch(() => []),
  ]);

  // Only render a social icon when a real URL is configured — an icon linking
  // to "#" is the sort of dead control this build is meant to be free of.
  const socials = [
    { Icon: Instagram, label: "Instagram", href: settings.socials.instagram },
    { Icon: Facebook, label: "Facebook", href: settings.socials.facebook },
    { Icon: Youtube, label: "YouTube", href: settings.socials.youtube },
  ].filter((s): s is { Icon: typeof Instagram; label: string; href: string } =>
    Boolean(s.href && s.href !== "#")
  );

  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="mx-auto max-w-content px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          <div>
            <h2 className="font-display text-lg font-semibold uppercase">Products</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-accent-foreground/85">
              {PRODUCTS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold uppercase">Category</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-accent-foreground/85">
              {categories.length > 0 ? (
                categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/category/${c.slug}`}
                      className="transition-colors hover:text-white"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link href="/shop" className="transition-colors hover:text-white">
                    Shop all
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold uppercase">Company info</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-accent-foreground/85">
              {COMPANY.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold uppercase">Follow us</h2>

            {socials.length > 0 ? (
              <div className="mt-4 flex gap-3">
                {socials.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-accent-foreground/70">
                Social links can be added in Admin → Settings.
              </p>
            )}

            <address className="mt-6 space-y-2 text-sm not-italic text-accent-foreground/85">
              {settings.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {settings.contactEmail}
                </a>
              )}
              {settings.phone && (
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  {settings.phone}
                </a>
              )}
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/25 pt-6">
          <p className="text-sm text-accent-foreground/75">
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-accent-foreground/75">
            {LEGAL.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
