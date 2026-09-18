import Link from "next/link";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getSiteSettings } from "@/lib/settings/site";
import { Logo } from "@/components/brand/logo";

const SHOP = [
  { label: "Shop all", href: "/shop" },
  { label: "New arrivals", href: "/shop?sort=newest" },
  { label: "Best rated", href: "/shop?sort=rating" },
  { label: "On sale", href: "/shop?onSale=1" },
];

const COMPANY = [
  { label: "About us", href: "/about" },
  { label: "Contact us", href: "/contact" },
  { label: "Track your order", href: "/account/orders" },
  { label: "Payment options", href: "/about#payments" },
  { label: "Size guide", href: "/about#sizes" },
];

const LEGAL = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Cookies", href: "/legal/cookies" },
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

  // Only real links become icons — an icon pointing at "#" is a dead control.
  const socials = [
    { Icon: Instagram, label: "Instagram", href: settings.socials.instagram },
    { Icon: Facebook, label: "Facebook", href: settings.socials.facebook },
    { Icon: Youtube, label: "YouTube", href: settings.socials.youtube },
  ].filter((s): s is { Icon: typeof Instagram; label: string; href: string } =>
    Boolean(s.href && s.href !== "#")
  );

  return (
    <footer className="surface-dark relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />

      <div className="mx-auto max-w-content px-5 pb-10 pt-20 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-10">
          <div>
            <Logo logoUrl={settings.logoUrl} name={settings.storeName} size="lg" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory/55">
              Premium footwear, chosen for how it wears — performance runners,
              everyday classics and hand-finished leather.
            </p>

            {socials.length > 0 && (
              <div className="mt-7 flex gap-2">
                {socials.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-ivory/75 transition-colors hover:border-gold/60 hover:text-gold-light"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </a>
                ))}
              </div>
            )}
          </div>

          <FooterColumn title="Shop" links={SHOP} />
          <FooterColumn
            title="Collections"
            links={
              categories.length
                ? categories.map((c) => ({ label: c.name, href: `/category/${c.slug}` }))
                : [{ label: "Shop all", href: "/shop" }]
            }
          />

          <div>
            <FooterColumn title="Company" links={COMPANY} />
            {(settings.contactEmail || settings.phone || settings.address) && (
              <address className="mt-8 space-y-3 text-sm not-italic text-ivory/60">
                {settings.contactEmail && (
                  <a href={`mailto:${settings.contactEmail}`} className="flex items-start gap-2.5 transition-colors hover:text-gold-light">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                    {settings.contactEmail}
                  </a>
                )}
                {settings.phone && (
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-start gap-2.5 transition-colors hover:text-gold-light">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                    {settings.phone}
                  </a>
                )}
                {settings.address && (
                  <p className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                    {settings.address}
                  </p>
                )}
              </address>
            )}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-white/10 pt-8 text-xs text-ivory/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="uppercase tracking-[0.12em] transition-colors hover:text-gold-light">
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

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h2 className="eyebrow text-gold-light">{title}</h2>
      <ul className="mt-6 space-y-3 text-sm text-ivory/65">
        {links.map((l) => (
          <li key={`${l.label}-${l.href}`}>
            <Link href={l.href} className="transition-colors hover:text-ivory">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
