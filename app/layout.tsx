import type { Metadata, Viewport } from "next";
import { Roboto_Slab, Inter } from "next/font/google";
import "./globals.css";

// The reference sets its headings — and the wordmark — in a heavy slab serif,
// not a condensed sans. Roboto Slab carries the same weight range the rest of
// the UI already asks for (`font-medium` through `font-bold`), so nothing has
// to fake a bold.
const display = Roboto_Slab({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
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
    default: "Shoe Express — Premium footwear for every step",
    template: "%s · Shoe Express",
  },
  description:
    "Sneakers, performance runners, leather Oxfords and waterproof boots, chosen for how they wear. Free delivery over $100.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  applicationName: "Shoe Express",
  openGraph: {
    type: "website",
    siteName: "Shoe Express",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0d7f8f",
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
