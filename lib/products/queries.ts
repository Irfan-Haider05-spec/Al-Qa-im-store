import { prisma } from "@/lib/db/prisma";
import { cachedStorefront } from "@/lib/cache/storefront";
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
  brand?: string; // brand slug
  gender?: string; // men | women | unisex | kids
  size?: string; // size label, e.g. "10"
  color?: string; // colour name, e.g. "Black"
  onSale?: boolean;
  inStock?: boolean;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

const orderByFor: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  newest: [{ createdAt: "desc" }],
  "price-asc": [{ basePrice: "asc" }],
  "price-desc": [{ basePrice: "desc" }],
  // Prisma can't order by an aggregate of a filtered relation, so "best rated"
  // orders by review volume here and is re-sorted by average below.
  rating: [{ reviews: { _count: "desc" } }],
};

// Shared include so cards always have what they need.
export const productCardInclude = {
  category: { select: { slug: true, name: true } },
  brand: { select: { slug: true, name: true } },
  images: { orderBy: { position: "asc" } },
  colors: true,
  reviews: { where: { isApproved: true }, select: { rating: true } },
  variants: { select: { id: true, inventory: { select: { available: true } } } },
} satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{
  include: typeof productCardInclude;
}>;

function buildWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const {
    q,
    category,
    brand,
    gender,
    size,
    color,
    onSale,
    inStock,
    minPrice,
    maxPrice,
  } = filters;

  return {
    isPublished: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(brand ? { brand: { slug: brand } } : {}),
    ...(gender ? { gender: gender.toUpperCase() as Gender } : {}),
    ...(size ? { sizes: { some: { label: size } } } : {}),
    ...(color ? { colors: { some: { name: { equals: color, mode: "insensitive" } } } } : {}),
    ...(onSale ? { isOnSale: true } : {}),
    ...(inStock
      ? { variants: { some: { inventory: { available: { gt: 0 } } } } }
      : {}),
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
            { shortDesc: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { tags: { has: q.toLowerCase() } },
            { brand: { name: { contains: q, mode: "insensitive" } } },
            { category: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

const average = (reviews: { rating: number }[]) =>
  reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

export async function getProducts(filters: ProductFilters = {}) {
  const { sort = "featured", page = 1, perPage = 12, minRating } = filters;
  const where = buildWhere(filters);

  // A minimum-rating filter can only be applied once reviews are loaded, so it
  // is paginated in memory over the matching set rather than in SQL.
  if (minRating) {
    const all = await prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy: orderByFor[sort],
    });
    const filtered = all.filter((p) => average(p.reviews) >= minRating);
    if (sort === "rating") {
      filtered.sort((a, b) => average(b.reviews) - average(a.reviews));
    }
    const total = filtered.length;
    return {
      products: filtered.slice((page - 1) * perPage, page * perPage),
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  }

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

  if (sort === "rating") {
    products.sort((a, b) => average(b.reviews) - average(a.reviews));
  }

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
      sizes: { orderBy: { position: "asc" } },
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

/* ----------------------------------------------------- facets for the shop -- */

/** Every value the shop's filter sidebar can offer, straight from the catalogue. */
export async function getFilterFacets() {
  const [brands, sizes, colors, priceRange] = await Promise.all([
    prisma.brand.findMany({
      where: { products: { some: { isPublished: true } } },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.productSize.findMany({
      where: { product: { isPublished: true } },
      select: { label: true },
      distinct: ["label"],
      orderBy: { position: "asc" },
    }),
    prisma.productColor.findMany({
      where: { product: { isPublished: true } },
      select: { name: true, hex: true },
      distinct: ["name"],
      orderBy: { name: "asc" },
    }),
    prisma.product.aggregate({
      where: { isPublished: true },
      _min: { basePrice: true },
      _max: { basePrice: true },
    }),
  ]);

  return {
    brands,
    // Numeric labels first and in numeric order ("7" before "10"), then the rest.
    sizes: sizes
      .map((s) => s.label)
      .sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      }),
    colors,
    minPrice: Math.floor(Number(priceRange._min.basePrice ?? 0)),
    maxPrice: Math.ceil(Number(priceRange._max.basePrice ?? 500)),
  };
}

/* --------------------------------------------------------- homepage blocks -- */

/**
 * Everything the homepage renders, in one round trip. All of it is CMS/DB
 * driven: change a heading in Admin → Homepage, or flip a product's
 * "New arrival" flag, and this is what the page picks up.
 */
export async function getHomepageContent() {
  const [homepage, categories, newArrivals, featured, banner] = await Promise.all([
    prisma.homepage.findFirst({
      include: {
        slides: { where: { isActive: true }, orderBy: { position: "asc" } },
      },
    }),
    getCategories(),
    prisma.product.findMany({
      where: { isPublished: true, isNewArrival: true },
      include: productCardInclude,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isPublished: true, isFeatured: true },
      include: productCardInclude,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.banner.findFirst({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: new Date() } }] },
          { OR: [{ endAt: null }, { endAt: { gte: new Date() } }] },
        ],
      },
      orderBy: { id: "asc" },
    }),
  ]);

  // The weekly pick is chosen in Admin; fall back to the flagged product so the
  // section never renders empty on a fresh install.
  const weeklyPick = await prisma.product.findFirst({
    where: homepage?.weeklyPickProductId
      ? { id: homepage.weeklyPickProductId, isPublished: true }
      : { isWeeklyPick: true, isPublished: true },
    include: {
      images: { orderBy: { position: "asc" } },
      colors: true,
      sizes: { orderBy: { position: "asc" } },
      variants: { include: { inventory: true, color: true, size: true } },
      reviews: { where: { isApproved: true }, select: { rating: true } },
    },
  });

  return {
    homepage,
    categories,
    newArrivals: newArrivals.length ? newArrivals : featured,
    featured,
    weeklyPick,
    banner,
  };
}

/** Products behind one "Popular right now" pill. */
export async function getPopularProducts(categorySlug: string | null, take = 4) {
  return prisma.product.findMany({
    where: {
      isPublished: true,
      ...(categorySlug === "sale"
        ? { isOnSale: true }
        : categorySlug
          ? { category: { slug: categorySlug } }
          : {}),
    },
    include: productCardInclude,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take,
  });
}

/* ------------------------------------------------------------------ search -- */

/** Lightweight payload for the header's search-as-you-type panel. */
export async function searchSuggestions(q: string, take = 6) {
  const term = q.trim();
  if (term.length < 2) return [];

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { tags: { has: term.toLowerCase() } },
        { brand: { name: { contains: term, mode: "insensitive" } } },
        { category: { name: { contains: term, mode: "insensitive" } } },
      ],
    },
    select: {
      slug: true,
      name: true,
      basePrice: true,
      salePrice: true,
      category: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
    take,
  });

  return products.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category?.name ?? null,
    price: Number(p.salePrice ?? p.basePrice),
    image: p.images[0]?.url ?? null,
  }));
}

/* ------------------------------------------------------------- hero slides -- */

/**
 * Active hero slides with the product each one links to, so the hero caption
 * can show a real name and price. `HeroSlide.productId` is a plain column (the
 * slide can outlive its product), hence the second lookup rather than an
 * include — and why a slide whose product was unpublished or deleted simply
 * shows no caption instead of a broken link.
 */
async function readHeroSlides() {
  const slides = await prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });

  const ids = slides.map((s) => s.productId).filter((id): id is string => Boolean(id));
  const products = ids.length
    ? await prisma.product.findMany({
        where: { id: { in: ids }, isPublished: true },
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          salePrice: true,
          category: { select: { name: true } },
        },
      })
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));

  return slides.map((slide) => {
    const product = slide.productId ? byId.get(slide.productId) : undefined;
    return {
      imageUrl: slide.imageUrl,
      durationMs: slide.durationMs,
      product: product
        ? {
            name: product.name,
            slug: product.slug,
            price: Number(product.salePrice ?? product.basePrice),
            compareAt: product.salePrice != null ? Number(product.basePrice) : null,
            category: product.category?.name ?? null,
          }
        : null,
    };
  });
}

/* ------------------------------------------------------------ social proof -- */

/**
 * Real, approved, well-rated reviews with something to say — for the homepage
 * testimonials. Nothing here is invented: an empty store shows no section.
 */
async function readFeaturedReviews(take = 6) {
  const reviews = await prisma.review.findMany({
    where: {
      isApproved: true,
      rating: { gte: 4 },
      comment: { not: null },
      product: { isPublished: true },
    },
    include: {
      user: { select: { name: true } },
      product: { select: { name: true, slug: true } },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: take * 3,
  });

  // One review per product, so the wall isn't five takes on the same shoe.
  const seen = new Set<string>();
  const unique = reviews.filter((r) => {
    if (seen.has(r.productId)) return false;
    seen.add(r.productId);
    return true;
  });

  return unique.slice(0, take).map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    comment: r.comment ?? "",
    // First name and initial only — enough to feel real, not enough to expose.
    author: r.user?.name
      ? r.user.name.split(" ").map((part, i) => (i === 0 ? part : `${part[0]}.`)).join(" ")
      : "Verified buyer",
    product: r.product,
  }));
}

/* Cached: JSON-safe, identical for every visitor, invalidated from the admin. */
export const getHeroSlides = cachedStorefront(readHeroSlides, "hero-slides");
export const getFeaturedReviews = cachedStorefront(readFeaturedReviews, "featured-reviews");

/** Active categories for the header menu and footer, on every page. */
export const getNavCategories = cachedStorefront(
  () =>
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, name: true, imageUrl: true },
      orderBy: { name: "asc" },
      take: 9,
    }),
  "nav-categories"
);
