import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/store/contact-form";
import { getSiteSettings } from "@/lib/settings/site";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the ${BRAND.name} team about orders, sizing or returns.`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  const details = [
    settings.contactEmail && {
      Icon: Mail,
      label: "Email",
      value: settings.contactEmail,
      href: `mailto:${settings.contactEmail}`,
    },
    settings.phone && {
      Icon: Phone,
      label: "Phone",
      value: settings.phone,
      href: `tel:${settings.phone.replace(/\s/g, "")}`,
    },
    settings.address && { Icon: MapPin, label: "Studio", value: settings.address, href: null },
    { Icon: Clock, label: "Hours", value: "Mon–Sat, 10:00–19:00", href: null },
  ].filter(Boolean) as { Icon: typeof Mail; label: string; value: string; href: string | null }[];

  return (
    <div className="mx-auto max-w-content px-5 pb-24 pt-36 sm:px-8 lg:px-12">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div>
          <p className="eyebrow flex items-center gap-3 text-gold-ink">
            <span className="h-px w-7 bg-gold-ink/60" aria-hidden />
            We’re here to help
          </p>
          <h1 className="mt-5 font-display text-[clamp(2.4rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.02em]">
            Contact us
          </h1>
          <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
            A question about an order, sizing or a return? Send us a message and
            a person — not a bot — will reply within one working day.
          </p>

          <dl className="mt-12 space-y-7">
            {details.map(({ Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 text-gold-ink">
                  <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden />
                </span>
                <div>
                  <dt className="eyebrow text-[0.62rem] text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium">
                    {href ? (
                      <a href={href} className="underline-offset-4 hover:underline">
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-card border border-border bg-background p-7 shadow-card sm:p-10">
          <h2 className="font-display text-2xl">Send a message</h2>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
