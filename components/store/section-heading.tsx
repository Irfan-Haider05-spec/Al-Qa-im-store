import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * The editorial heading every homepage section opens with: a small tracked
 * label, a serif title, an optional line of copy and an optional link.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  tone = "light",
  as: Tag = "h2",
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  align?: "left" | "center";
  /** `light` for ivory sections, `dark` for the ink ones. */
  tone?: "light" | "dark";
  as?: "h1" | "h2";
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-x-10 gap-y-5",
        align === "center" ? "flex-col items-center text-center" : "justify-between",
        className
      )}
    >
      <div className={cn(align === "center" && "flex flex-col items-center")}>
        <p
          className={cn(
            "eyebrow flex items-center gap-3",
            dark ? "text-gold-light" : "text-gold-ink"
          )}
        >
          <span className={cn("h-px w-7", dark ? "bg-gold/70" : "bg-gold-ink/60")} aria-hidden />
          {eyebrow}
        </p>
        <Tag
          className={cn(
            "mt-4 font-display text-[clamp(2rem,4vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em]",
            dark ? "text-ivory" : "text-foreground"
          )}
        >
          {title}
        </Tag>
        {description && (
          <p
            className={cn(
              "mt-4 max-w-lg leading-relaxed",
              dark ? "text-ivory/60" : "text-muted-foreground"
            )}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className={cn(
            "group inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] underline-offset-8 hover:underline",
            dark ? "text-gold-light" : "text-foreground"
          )}
        >
          {action.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
    </div>
  );
}
