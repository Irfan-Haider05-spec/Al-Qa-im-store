"use client";

import { useId } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { BRAND } from "@/lib/brand";

/**
 * The Al-Qa’im monogram: a tall gold "A" with a ribbon sweeping through it.
 *
 * Drawn as vector rather than shipped as a bitmap so it stays crisp from a
 * 16px favicon to a full-width hero, and weighs a few hundred bytes. The gap
 * where the ribbon crosses the letter is cut with a mask, not painted black,
 * so the mark works on any background — dark header or ivory page.
 *
 * `useId` keeps the gradient and mask ids unique, so several logos on one page
 * (header and footer) don't end up sharing one definition.
 */
export function LogoMark({
  className,
  title = BRAND.name,
}: {
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  const gradient = `logo-gold-${id}`;
  const ribbon = `logo-ribbon-${id}`;
  const mask = `logo-gap-${id}`;

  return (
    <svg
      viewBox="0 0 640 430"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradient} x1="0.15" y1="0" x2="0.55" y2="1">
          <stop offset="0" stopColor="#FCEBB0" />
          <stop offset="0.35" stopColor="#EDC76F" />
          <stop offset="0.75" stopColor="#D8A245" />
          <stop offset="1" stopColor="#B9832F" />
        </linearGradient>
        <path
          id={ribbon}
          d="M88 334C58 282 74 214 150 198C226 180 292 214 358 262C418 306 468 346 520 366C560 381 600 384 632 370C606 398 560 416 504 410C448 404 404 374 356 334C298 286 236 236 170 236C122 236 100 268 104 304C105 314 98 326 88 334Z"
        />
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="430">
          <rect width="640" height="430" fill="#fff" />
          <use href={`#${ribbon}`} fill="#000" stroke="#000" strokeWidth="14" />
        </mask>
      </defs>
      <path
        mask={`url(#${mask})`}
        fill={`url(#${gradient})`}
        d="M300 4L494 356L446 338L300 118L168 336C154 364 150 390 168 404C178 412 194 414 206 414L206 420L6 420L6 414C40 410 62 392 82 360Z"
      />
      <use href={`#${ribbon}`} fill={`url(#${gradient})`} />
    </svg>
  );
}

/**
 * Mark plus wordmark. When a logo has been uploaded in Admin → Settings it
 * replaces the drawn one, so the brand's own artwork always wins.
 */
export function Logo({
  logoUrl,
  name = BRAND.name,
  tone = "light",
  size = "md",
  className,
}: {
  logoUrl?: string | null;
  name?: string;
  /** `light` = ivory wordmark for dark surfaces; `dark` = ink for light ones. */
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = {
    sm: { mark: "h-6 w-9", text: "text-lg" },
    md: { mark: "h-8 w-12", text: "text-[1.35rem]" },
    lg: { mark: "h-12 w-[4.5rem]", text: "text-3xl" },
  }[size];

  if (logoUrl) {
    return (
      <span className={cn("relative inline-flex h-10 w-36", className)}>
        <Image src={logoUrl} alt={name} fill sizes="144px" className="object-contain" />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("shrink-0", dims.mark)} title="" />
      <span
        className={cn(
          "font-display font-semibold leading-none tracking-[0.01em]",
          dims.text,
          tone === "light" ? "text-ivory" : "text-foreground"
        )}
      >
        {name}
      </span>
    </span>
  );
}
