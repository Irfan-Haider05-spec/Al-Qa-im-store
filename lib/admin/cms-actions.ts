"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { z } from "zod";

// ---------------- Homepage ----------------
const homepageSchema = z.object({
  heroHeading: z.string().min(1),
  heroSubheading: z.string().min(1),
  heroDescription: z.string().min(1),
  heroCtaLabel: z.string().min(1),
  heroCtaUrl: z.string().min(1),
  weeklyPickHeading: z.string().optional().or(z.literal("")),
  weeklyPickDesc: z.string().optional().or(z.literal("")),
  weeklyPickProductId: z.string().optional().or(z.literal("")),
  membershipHeading: z.string().optional().or(z.literal("")),
  membershipCtaLabel: z.string().optional().or(z.literal("")),
  membershipCtaUrl: z.string().optional().or(z.literal("")),
});

export async function saveHomepage(input: unknown) {
  const admin = await requirePermission("homepage.write");
  const parsed = homepageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;
  const data = {
    heroHeading: d.heroHeading,
    heroSubheading: d.heroSubheading,
    heroDescription: d.heroDescription,
    heroCtaLabel: d.heroCtaLabel,
    heroCtaUrl: d.heroCtaUrl,
    weeklyPickHeading: d.weeklyPickHeading || null,
    weeklyPickDesc: d.weeklyPickDesc || null,
    weeklyPickProductId: d.weeklyPickProductId || null,
    membershipHeading: d.membershipHeading || null,
    membershipCtaLabel: d.membershipCtaLabel || null,
    membershipCtaUrl: d.membershipCtaUrl || null,
  };

  const existing = await prisma.homepage.findFirst();
  if (existing) {
    await prisma.homepage.update({ where: { id: existing.id }, data });
  } else {
    await prisma.homepage.create({ data });
  }

  await logActivity({
    userId: admin.id,
    action: "homepage.updated",
    entity: "Homepage",
  });
  revalidatePath("/");
  revalidatePath("/admin/homepage");
  return { ok: true };
}

// ---------------- Banner ----------------
const bannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().or(z.literal("")),
  imageUrl: z.string().min(1, "Image is required"),
  ctaLabel: z.string().optional().or(z.literal("")),
  ctaUrl: z.string().optional().or(z.literal("")),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export async function createBanner(input: unknown) {
  const admin = await requirePermission("homepage.write");
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;
  await prisma.banner.create({
    data: {
      title: d.title,
      subtitle: d.subtitle || null,
      imageUrl: d.imageUrl,
      ctaLabel: d.ctaLabel || null,
      ctaUrl: d.ctaUrl || null,
      startAt: d.startAt ? new Date(d.startAt) : null,
      endAt: d.endAt ? new Date(d.endAt) : null,
      isActive: d.isActive,
    },
  });
  await logActivity({ userId: admin.id, action: "banner.created", entity: "Banner" });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleBanner(id: string, active: boolean) {
  await requirePermission("homepage.write");
  await prisma.banner.update({ where: { id }, data: { isActive: active } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteBanner(id: string) {
  await requirePermission("homepage.write");
  await prisma.banner.delete({ where: { id } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

// ---------------- SEO ----------------
export async function saveSeo(input: {
  pageKey: string;
  title: string;
  description: string;
  ogImageUrl: string;
}) {
  const admin = await requirePermission("settings.write");
  const { pageKey, title, description, ogImageUrl } = input;
  if (!pageKey) return { ok: false, error: "Page key required" };

  await prisma.sEOSettings.upsert({
    where: { pageKey },
    update: {
      title: title || null,
      description: description || null,
      ogImageUrl: ogImageUrl || null,
    },
    create: {
      pageKey,
      title: title || null,
      description: description || null,
      ogImageUrl: ogImageUrl || null,
    },
  });
  await logActivity({
    userId: admin.id,
    action: "seo.updated",
    entity: "SEOSettings",
    meta: { pageKey },
  });
  revalidatePath("/admin/seo");
  return { ok: true };
}

// ---------------- Site settings ----------------
const settingsSchema = z.object({
  storeName: z.string().min(1),
  logoUrl: z.string().optional().or(z.literal("")),
  contactEmail: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  currency: z.string().min(1),
  flatShipping: z.coerce.number().nonnegative().optional().nullable(),
  freeShippingThreshold: z.coerce.number().nonnegative().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(1).optional().nullable(),
  instagram: z.string().optional().or(z.literal("")),
  facebook: z.string().optional().or(z.literal("")),
  youtube: z.string().optional().or(z.literal("")),
});

export async function saveSettings(input: unknown) {
  const admin = await requirePermission("settings.write");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;
  const data = {
    storeName: d.storeName,
    logoUrl: d.logoUrl || null,
    contactEmail: d.contactEmail || null,
    phone: d.phone || null,
    address: d.address || null,
    currency: d.currency,
    flatShipping: d.flatShipping ?? null,
    freeShippingThreshold: d.freeShippingThreshold ?? null,
    taxRate: d.taxRate ?? null,
    socials: {
      instagram: d.instagram || "",
      facebook: d.facebook || "",
      youtube: d.youtube || "",
    },
  };

  const existing = await prisma.siteSettings.findFirst();
  if (existing) {
    await prisma.siteSettings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.siteSettings.create({ data });
  }
  await logActivity({
    userId: admin.id,
    action: "settings.updated",
    entity: "SiteSettings",
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true };
}

// ---------------- Hero slides ----------------

/**
 * The hero carousel is CMS-driven: slides, their order, how long each one
 * holds and whether it runs at all are all editable here, and the storefront
 * picks the change up on the next request because every mutation revalidates
 * the homepage.
 */
const heroSlideSchema = z.object({
  imageUrl: z.string().min(1, "An image is required"),
  productId: z.string().optional().or(z.literal("")),
  durationMs: z.coerce.number().int().min(600).max(20000),
  isActive: z.boolean().default(true),
});

/** Every slide belongs to the single homepage row; create it if it's missing. */
async function requireHomepageId() {
  const existing = await prisma.homepage.findFirst({ select: { id: true } });
  if (existing) return existing.id;

  const created = await prisma.homepage.create({
    data: {
      heroHeading: "SPORTS SHOES",
      heroSubheading: "Men's collection",
      heroDescription: "Premium footwear for every step.",
      heroCtaLabel: "Shop Now",
      heroCtaUrl: "/shop",
    },
    select: { id: true },
  });
  return created.id;
}

export async function createHeroSlide(input: unknown) {
  const admin = await requirePermission("homepage.write");
  const parsed = heroSlideSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  const homepageId = await requireHomepageId();
  const last = await prisma.heroSlide.findFirst({
    where: { homepageId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.heroSlide.create({
    data: {
      homepageId,
      imageUrl: parsed.data.imageUrl,
      productId: parsed.data.productId || null,
      durationMs: parsed.data.durationMs,
      isActive: parsed.data.isActive,
      position: (last?.position ?? -1) + 1,
    },
  });

  await logActivity({ userId: admin.id, action: "hero.slide.created", entity: "HeroSlide" });
  revalidatePath("/");
  revalidatePath("/admin/homepage");
  return { ok: true };
}

export async function updateHeroSlide(id: string, input: unknown) {
  const admin = await requirePermission("homepage.write");
  const parsed = heroSlideSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  const { imageUrl, productId, durationMs, isActive } = parsed.data;
  await prisma.heroSlide.update({
    where: { id },
    data: {
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(productId !== undefined ? { productId: productId || null } : {}),
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  await logActivity({ userId: admin.id, action: "hero.slide.updated", entity: "HeroSlide", meta: { id } });
  revalidatePath("/");
  revalidatePath("/admin/homepage");
  return { ok: true };
}

export async function deleteHeroSlide(id: string) {
  const admin = await requirePermission("homepage.write");
  await prisma.heroSlide.delete({ where: { id } });

  await logActivity({ userId: admin.id, action: "hero.slide.deleted", entity: "HeroSlide", meta: { id } });
  revalidatePath("/");
  revalidatePath("/admin/homepage");
  return { ok: true };
}

/**
 * Moves a slide one place up or down.
 *
 * The two rows swap positions inside a transaction, so a failure halfway
 * through can't leave two slides claiming the same slot.
 */
export async function moveHeroSlide(id: string, direction: "up" | "down") {
  await requirePermission("homepage.write");

  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) return { ok: false, error: "Slide not found" };

  const neighbour = await prisma.heroSlide.findFirst({
    where: {
      homepageId: slide.homepageId,
      position: direction === "up" ? { lt: slide.position } : { gt: slide.position },
    },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return { ok: true };

  await prisma.$transaction([
    prisma.heroSlide.update({ where: { id: slide.id }, data: { position: neighbour.position } }),
    prisma.heroSlide.update({ where: { id: neighbour.id }, data: { position: slide.position } }),
  ]);

  revalidatePath("/");
  revalidatePath("/admin/homepage");
  return { ok: true };
}
