import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

// Playfair Display is the closest open face to the Al-Qa’im wordmark: a
// high-contrast transitional serif. Italic is loaded for the gold accent line
// in the hero; the weights cover `font-medium` through `font-black`.
const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: BRAND.themeColor,
  width: "device-width",
  initialScale: 1,
};

/**
 * Marks the document as JavaScript-capable before first paint.
 *
 * Every scroll-reveal hides itself behind `[data-js="on"]`, so if this script
 * never runs the page renders fully visible instead of blank. It is inline and
 * attribute-only, so it costs no request and cannot cause a layout shift.
 */
const ENABLE_JS_REVEALS = `document.documentElement.dataset.js="on"`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable}`}
      // The inline script below adds `data-js` before React hydrates, which is
      // the whole point — tell React the difference is deliberate.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ENABLE_JS_REVEALS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
