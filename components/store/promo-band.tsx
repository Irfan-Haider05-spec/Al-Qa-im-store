import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";

export type PromoBanner = {
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

/**
 * The campaign band: a full-bleed photograph fading into ink, with the copy
 * set over the dark side. Content comes from Admin → Banners and respects the
 * banner's start and end dates.
 */
export function PromoBand({ banner }: { banner: PromoBanner }) {
  return (
    <section className="surface-dark relative isolate overflow-hidden">
      <div className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[62%]">
        <Image
          src={banner.imageUrl}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 62vw"
          className="object-cover opacity-60 lg:opacity-90"
        />
        {/* Fades the photo into the ink so the edge never shows. */}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent" />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
      </div>

      <div className="mx-auto max-w-content px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <FadeIn className="max-w-lg">
          <p className="eyebrow flex items-center gap-3 text-gold-light">
            <span className="h-px w-7 bg-gold/70" aria-hidden />
            Limited time
          </p>
          <h2 className="mt-5 font-display text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ivory">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className="mt-5 max-w-md leading-relaxed text-ivory/70">{banner.subtitle}</p>
          )}
          {banner.ctaUrl && (
            <Link
              href={banner.ctaUrl}
              className="group mt-10 inline-flex h-14 items-center gap-3 rounded-pill bg-gold-gradient px-8 text-sm font-semibold uppercase tracking-[0.14em] text-ink shadow-gold transition-transform hover:-translate-y-0.5"
            >
              {banner.ctaLabel ?? "Shop now"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          )}
        </FadeIn>
      </div>
    </section>
  );
}
