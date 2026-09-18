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
    title: "Chosen for the hundredth mile",
    body: "Every style is worn before it is listed. If it isn't comfortable at the end of a long day, it doesn't make the edit.",
  },
  {
    title: "Authentic, always",
    body: "We buy direct and inspect every pair before it ships. No grey imports, no seconds, no surprises in the box.",
  },
  {
    title: "Made to be kept",
    body: "Leather that ages well, soles that can be resoled, and a two-year guarantee against manufacturing faults.",
  },
];

// Approximate conversions — lasts differ between makers, so each product page
// also notes whether a style runs large or small.
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
              Footwear worth <span className="italic text-gold-gradient">standing</span> in.
            </h1>
            <p className="mt-6 max-w-lg leading-relaxed text-ivory/65">
              {settings.storeName} began with a simple frustration: shoes that
              looked the part and gave out in a season. So we built a shop around
              the opposite idea — fewer styles, each one chosen for how it wears
              rather than how it photographs.
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
            description="Measure your foot heel to longest toe, standing, at the end of the day — then read across. Between sizes? Go up half a size."
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <SizeTable caption="Men’s" rows={MENS} />
            <SizeTable caption="Women’s" rows={WOMENS} />
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Conversions are approximate — lasts vary between makers, so each
            product page notes when a style runs large or small.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-content gap-12 px-5 py-20 sm:px-8 md:grid-cols-2 lg:px-12 lg:py-28">
        <div id="payments" className="scroll-mt-28">
          <p className="eyebrow text-gold-ink">Payment</p>
          <h2 className="mt-3 font-display text-3xl">Payment options</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We currently accept <strong className="font-semibold text-foreground">cash on delivery</strong>:
            you pay the courier when your order arrives, so you see the pair
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
              unworn pairs in their original box.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Guarantee:</strong> two years against
              manufacturing faults.
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

function SizeTable({ caption, rows }: { caption: string; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-background">
      <table className="w-full text-sm">
        <caption className="border-b border-border px-5 py-4 text-left font-display text-lg">
          {caption}
        </caption>
        <thead>
          <tr className="text-left">
            {["US", "UK", "EU", "Foot (cm)"].map((h) => (
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
