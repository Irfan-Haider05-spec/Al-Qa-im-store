import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, priority: 1 },
    { url: `${BASE}/shop`, priority: 0.9 },
    { url: `${BASE}/contact`, priority: 0.4 },
    { url: `${BASE}/about`, priority: 0.4 },
    ...["privacy", "terms", "cookies", "imprint"].map((slug) => ({
      url: `${BASE}/legal/${slug}`,
      priority: 0.2,
    })),
  ];

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true },
      }),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((c: { slug: string }) => ({
        url: `${BASE}/category/${c.slug}`,
        priority: 0.7,
      })),
      ...products.map((p: { slug: string; updatedAt: Date }) => ({
        url: `${BASE}/products/${p.slug}`,
        lastModified: p.updatedAt,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
