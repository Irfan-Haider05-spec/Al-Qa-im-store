import type { NextConfig } from "next";

// Security headers applied to every route.
//
// The CSP here is deliberately the part that cannot break the app: it stops
// the site being framed elsewhere (clickjacking), plugins, <base> hijacking
// and forms posting off-site. A script-src policy needs per-request nonces for
// Next's inline bootstrap scripts; add one if a third-party script is ever
// introduced.
const contentSecurityPolicy = [
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Uploaded images live in Supabase Storage; Cloudinary is allowed for
    // stores that host their catalogue there. Keep in step with IMAGE_HOSTS in
    // lib/validations/urls.ts, which stops the admin saving any other host.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    formats: ["image/avif", "image/webp"],
    // Product photography is cached for a month once optimised.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Bundled photography rarely changes; a week in browser caches, with
        // background revalidation, keeps repeat visits instant without pinning
        // a replaced file forever.
        source: "/(products|hero|categories|banners|brand)/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
