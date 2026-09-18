import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { cachedStorefront } from "@/lib/cache/storefront";
import { normaliseFilters, type FilterSetting } from "@/lib/catalog/shop-filters";

export type SiteSettingsView = {
  storeName: string;
  currency: string;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  flatShipping: number;
  freeShippingThreshold: number | null;
  taxRate: number;
  socials: { instagram?: string; facebook?: string; youtube?: string };
  /** Shop sidebar filter groups, in order, with their on/off state. */
  shopFilters: FilterSetting[];
};

const FALLBACK: SiteSettingsView = {
  storeName: "Al-Qa’im",
  currency: "USD",
  contactEmail: null,
  phone: null,
  address: null,
  logoUrl: null,
  flatShipping: 0,
  freeShippingThreshold: null,
  taxRate: 0,
  socials: {},
  shopFilters: normaliseFilters(null),
};

/**
 * Store settings, read once per request.
 *
 * `cache` dedupes the query across the layout, the footer and any page that
 * needs the currency or shipping rules, so a single render never hits the row
 * more than once. Falls back to sane defaults if the table is empty (or the
 * database is unreachable) rather than crashing the whole storefront over a
 * missing settings row.
 */
const readSettings = cachedStorefront(async (): Promise<SiteSettingsView> => {
  try {
    const settings = await prisma.siteSettings.findFirst();
    if (!settings) return FALLBACK;

    return {
      storeName: settings.storeName || FALLBACK.storeName,
      currency: settings.currency || FALLBACK.currency,
      contactEmail: settings.contactEmail,
      phone: settings.phone,
      address: settings.address,
      logoUrl: settings.logoUrl,
      flatShipping: Number(settings.flatShipping ?? 0),
      freeShippingThreshold:
        settings.freeShippingThreshold != null
          ? Number(settings.freeShippingThreshold)
          : null,
      taxRate: Number(settings.taxRate ?? 0),
      socials: (settings.socials as SiteSettingsView["socials"]) ?? {},
      shopFilters: normaliseFilters(settings.shopFilters),
    };
  } catch {
    return FALLBACK;
  }
}, "site-settings");

/** Per-request dedupe on top of the shared cache. */
export const getSiteSettings = cache(() => readSettings());

/** Human-readable shipping promise, e.g. "Free over $100 · $9 flat otherwise". */
export function describeShipping(settings: SiteSettingsView) {
  const flat =
    settings.flatShipping > 0
      ? `$${settings.flatShipping.toFixed(2)} flat`
      : "Free";

  if (settings.freeShippingThreshold == null) return `${flat} delivery`;
  return `Free over $${settings.freeShippingThreshold.toFixed(0)} · ${flat} otherwise`;
}
