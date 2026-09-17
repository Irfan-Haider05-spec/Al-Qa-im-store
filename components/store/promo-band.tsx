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
 * The full-bleed campaign band: oversized display type set behind the product
 * photograph, the way the reference stacks "BLACK FRIDAY" behind the shoe.
 *
 * The headline is split across two lines of outline type purely as decoration —
 * the readable heading sits in the foreground, so screen readers and crawlers
 * get the words once, not three times.
 */
export function PromoBand({ banner }: { banner: PromoBanner }) {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {/* Decorative oversized wordmark. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 grid select-none place-items-center overflow-hidden"
      >
        <span className="whitespace-nowrap font-display text-[22vw] font-bold leading-none tracking-tight text-white/10 sm:text-[16vw]">
          {banner.title.split(" ").slice(0, 2).join(" ")}
        </span>
      </span>

      <div className="relative mx-auto grid max-w-content items-center gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2">
        <FadeIn>
          <div className="max-w-md">
            <h2 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
              {banner.title}
            </h2>
            {banner.subtitle && (
              <p className="mt-4 text-base text-primary-foreground/85">
                {banner.subtitle}
              </p>
            )}
            {banner.ctaUrl && (
              <Link
                href={banner.ctaUrl}
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-pill bg-background px-8 text-sm font-medium text-foreground shadow-card transition-transform hover:-translate-y-0.5"
              >
                {banner.ctaLabel ?? "Shop now"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card shadow-hover">
            <Image
              src={banner.imageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 92vw, 46vw"
              className="object-cover"
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
