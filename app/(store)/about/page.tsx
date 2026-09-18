import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { SectionHeading } from "@/components/store/section-heading";
import { getSiteSettings, describeShipping } from "@/lib/settings/site";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About us",
  description: `The story behind ${BRAND.name}, our size guide, payment options, delivery and returns.`,
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    title: "Chosen for how it wears",
    body: "Every style is worn before it is listed. If it isn't comfortable at the end of a long day, it doesn't make the edit.",
  },
  {
    title: "Checked before it ships",
    body: "Every order is inspected and packed by hand. No seconds, no surprises in the box.",
  },
  {
    title: "Made to be kept",
    body: "Leather that ages well, fabrics that hold their shape, and 30 days to return anything unworn.",
  },
];

// Approximate conversions — lasts and cuts differ between makers, so each
// product page also notes whether a style runs large or small.
const SHOE_HEAD = ["US", "UK", "EU", "Foot (cm)"];
const MENS = [
  ["7", "6", "40", "25.0"],
  ["8", "7", "41", "25.8"],
  ["9", "8", "42.5", "26.7"],
  ["10", "9", "44", "27.5"],
  ["11", "10", "45", "28.3"],
  ["12", "11", "46", "29.2"],
];
const WOMENS = [
  ["5", "3", "35.5", "22.0"],
  ["6", "4", "36.5", "22.9"],
  ["7", "5", "37.5", "23.8"],
  ["8", "6", "38.5", "24.6"],
  ["9", "7", "40", "25.4"],
  ["10", "8", "41", "26.2"],
];

const SHIRT_HEAD = ["Size", "Chest (cm)", "Chest (in)", "Collar (in)"];
const SHIRTS = [
  ["XS", "86–91", "34–36", "14"],
  ["S", "91–96", "36–38", "14.5"],
  ["M", "96–102", "38–40", "15–15.5"],
  ["L", "102–107", "40–42", "16–16.5"],
  ["XL", "107–112", "42–44", "17–17.5"],
  ["XXL", "112–117", "44–46", "18"],
];

const TROUSER_HEAD = ["Waist size", "Waist (cm)", "Hip (cm)", "Letter size"];
const TROUSERS = [
  ["28", "71", "89", "XS"],
  ["30", "76", "94", "S"],
  ["32", "81", "99", "M"],
  ["34", "86", "104", "L"],
  ["36", "91", "109", "XL"],
  ["38", "97", "114", "XXL"],
];

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <section className="surface-dark relative isolate overflow-hidden pt-32">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(50%_70%_at_75%_40%,rgb(201_161_74/0.16),transparent_70%)]"
        />
        <div className="mx-auto grid max-w-content items-center gap-12 px-5 pb-20 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:px-12 lg:pb-28">
          <div>
            <p className="eyebrow flex items-center gap-3 text-gold-light">
              <span className="h-px w-7 bg-gold/70" aria-hidden />
              Our story
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,6vw,4.6rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ivory">
              Made to be <span className="italic text-gold-gradient">worn</span>, and kept.
            </h1>
            <p className="mt-6 max-w-lg leading-relaxed text-ivory/65">
              {settings.storeName} began with a simple frustration: shoes and
              clothes that looked the part and gave out in a season. So we built a
              shop around the opposite idea — fewer styles, each one chosen for how
              it wears rather than how it photographs.
            </p>
          </div>
          <div className="hidden justify-center lg:flex">
            <LogoMark className="h-auto w-80 drop-shadow-[0_20px_60px_rgb(201_161_74/0.25)]" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-10 md:grid-cols-3">
          {VALUES.map((value, i) => (
            <div key={value.title} className="border-t border-gold/40 pt-6">
              <p className="font-display text-sm text-gold-ink">0{i + 1}</p>
              <h2 className="mt-3 font-display text-2xl leading-snug">{value.title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{value.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="sizes" className="scroll-mt-28 bg-muted/60">
        <div className="mx-auto max-w-content px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <SectionHeading
            eyebrow="Fit"
            title="Size guide"
            description="Shoes: measure your foot heel to longest toe, standing, at the end of the day. Shirts: measure around the fullest part of the chest. Trousers: measure your natural waist. Between sizes? Go up one."
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <SizeTable caption="Shoes — men’s" head={SHOE_HEAD} rows={MENS} />
            <SizeTable caption="Shoes — women’s" head={SHOE_HEAD} rows={WOMENS} />
            <SizeTable caption="Shirts" head={SHIRT_HEAD} rows={SHIRTS} />
            <SizeTable caption="Trousers" head={TROUSER_HEAD} rows={TROUSERS} />
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Conversions are approximate — lasts and cuts vary between makers, so
            each product page notes when a style runs large or small.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-content gap-12 px-5 py-20 sm:px-8 md:grid-cols-2 lg:px-12 lg:py-28">
        <div id="payments" className="scroll-mt-28">
          <p className="eyebrow text-gold-ink">Payment</p>
          <h2 className="mt-3 font-display text-3xl">Payment options</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We currently accept <strong className="font-semibold text-foreground">cash on delivery</strong>:
            you pay the courier when your order arrives, so you see your order
            before you part with anything. Card payment will be offered here as
            soon as it is live — we won’t take a card number until then.
          </p>
        </div>
        <div id="delivery" className="scroll-mt-28">
          <p className="eyebrow text-gold-ink">Delivery &amp; returns</p>
          <h2 className="mt-3 font-display text-3xl">Delivery and returns</h2>
          <ul className="mt-4 space-y-3 leading-relaxed text-muted-foreground">
            <li>
              <strong className="font-semibold text-foreground">Delivery:</strong> {describeShipping(settings)}.
              Orders are dispatched within one working day.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Returns:</strong> 30 days from delivery for
              unworn items in their original packaging.
            </li>
          </ul>
          <Link
            href="/contact"
            className="group mt-6 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] underline decoration-gold underline-offset-8"
          >
            Ask us anything
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}

function SizeTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-background">
      <table className="w-full text-sm">
        <caption className="border-b border-border px-5 py-4 text-left font-display text-lg">
          {caption}
        </caption>
        <thead>
          <tr className="text-left">
            {head.map((h) => (
              <th key={h} scope="col" className="eyebrow px-5 py-3 text-[0.62rem] text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-border">
              {row.map((cell, i) => (
                <td key={i} className={i === 0 ? "px-5 py-3 font-semibold" : "px-5 py-3 text-muted-foreground"}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
