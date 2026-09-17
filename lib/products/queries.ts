import { prisma } from "@/lib/db/prisma";
import type { Prisma, Gender } from "@prisma/client";

export type SortKey =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating";

export type ProductFilters = {
  q?: string;
  category?: string; // category slug
  gender?: string; // men | women | unisex | kids
  onSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

const orderByFor: Record<SortKey, Prisma.ProductOrderByWithRelationInput> = {
  featured: { isFeatured: "desc" },
  newest: { createdAt: "desc" },
  "price-asc": { basePrice: "asc" },
  "price-desc": { basePrice: "desc" },
  rating: { createdAt: "desc" }, // rating sort refined post-query below
};

// Shared include so cards always have what they need.
export const productCardInclude = {
  category: true,
  brand: true,
  images: { orderBy: { position: "asc" } },
  colors: true,
  reviews: { where: { isApproved: true }, select: { rating: true } },
  variants: { include: { inventory: true } },
} satisfies Prisma.ProductInclude;

export async function getProducts(filters: ProductFilters = {}) {
  const {
    q,
    category,
    gender,
    onSale,
    minPrice,
    maxPrice,
    sort = "featured",
    page = 1,
    perPage = 12,
  } = filters;

  const where: Prisma.ProductWhereInput = {
    isPublished: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(gender ? { gender: gender.toUpperCase() as Gender } : {}),
    ...(onSale ? { isOnSale: true } : {}),
    ...(minPrice != null || maxPrice != null
      ? {
          basePrice: {
            ...(minPrice != null ? { gte: minPrice } : {}),
            ...(maxPrice != null ? { lte: maxPrice } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { tags: { has: q.toLowerCase() } },
            { brand: { name: { contains: q, mode: "insensitive" } } },
            { category: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy: orderByFor[sort],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    products,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isPublished: true },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { position: "asc" } },
      colors: true,
      sizes: true,
      variants: { include: { inventory: true, color: true, size: true } },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  take = 4
) {
  if (!categoryId) return [];
  return prisma.product.findMany({
    where: { categoryId, isPublished: true, id: { not: excludeId } },
    include: productCardInclude,
    take,
    orderBy: { isFeatured: "desc" },
  });
}

export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}
