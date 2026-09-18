/**
 * Brand constants for places that cannot read the database: static metadata,
 * JSON-LD defaults, the web manifest. Everything a merchant edits at runtime
 * (store name, contact details, logo) lives in Admin → Settings and is read
 * through `getSiteSettings()` — this is only the fallback.
 */
export const BRAND = {
  name: "Al-Qa’im",
  /** Plain-ASCII form for contexts that mangle typographic quotes (email subjects, filenames). */
  asciiName: "Al-Qa'im",
  tagline: "Premium footwear, crafted to be worn",
  description:
    "Al-Qa’im — premium sneakers, performance runners, leather Oxfords and boots, chosen for how they wear. Complimentary delivery over $100.",
  themeColor: "#0B0B0C",
} as const;
