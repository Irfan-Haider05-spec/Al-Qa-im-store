"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/cache/storefront";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { normaliseFilters } from "@/lib/catalog/shop-filters";
import { BRAND } from "@/lib/brand";

/** Saves which shop filter groups show, and their order. */
export async function saveShopFilters(input: unknown) {
  const admin = await requirePermission("settings.write");
  if (!Array.isArray(input) || input.length > 50) {
    return { ok: false as const, error: "Invalid filter settings." };
  }
  // Normalising drops anything unknown and keeps every group present exactly once.
  const filters = normaliseFilters(input);

  const existing = await prisma.siteSettings.findFirst({ select: { id: true } });
  if (existing) {
    await prisma.siteSettings.update({ where: { id: existing.id }, data: { shopFilters: filters } });
  } else {
    await prisma.siteSettings.create({ data: { storeName: BRAND.name, shopFilters: filters } });
  }

  await logActivity({
    userId: admin.id,
    action: "shop_filters.updated",
    entity: "SiteSettings",
    meta: { enabled: filters.filter((f) => f.enabled).map((f) => f.key) },
  });
  revalidatePath("/admin/shop-filters");
  revalidateStorefront();
  return { ok: true as const };
}
