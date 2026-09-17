import { PrismaClient, Gender, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---- catalog definition -----------------------------------------------------
type SeedProduct = {
  name: string;
  slug: string;
  categorySlug: string;
  gender: Gender;
  basePrice: number;
  salePrice?: number;
  shortDesc: string;
  description: string;
  tags: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  flags?: Partial<{
    isFeatured: boolean;
    isNewArrival: boolean;
    isWeeklyPick: boolean;
    isOnSale: boolean;
  }>;
};

const CATEGORIES = [
  { name: "Sneakers", slug: "sneakers" },
  { name: "Sports Shoes", slug: "sports-shoes" },
  { name: "Oxford", slug: "oxford" },
  { name: "Shirts", slug: "shirts" },
  { name: "Trousers", slug: "trousers" },
  { name: "Sale", slug: "sale" },
];

const PRODUCTS: SeedProduct[] = [
  {
    name: "Aero Runner Teal",
    slug: "aero-runner-teal",
    categorySlug: "sneakers",
    gender: Gender.MEN,
    basePrice: 129,
    shortDesc: "Lightweight everyday runner.",
    description:
      "A lightweight everyday runner with responsive cushioning and a breathable knit upper.",
    tags: ["running", "lightweight", "new"],
    colors: [
      { name: "Teal", hex: "#0d7f8f" },
      { name: "White", hex: "#f4f7f8" },
    ],
    sizes: ["8", "9", "10", "11"],
    flags: { isFeatured: true, isNewArrival: true },
  },
  {
    name: "Roshe Racer",
    slug: "roshe-racer",
    categorySlug: "sneakers",
    gender: Gender.WOMEN,
    basePrice: 119,
    shortDesc: "Slip-on comfort for all day.",
    description:
      "A minimalist slip-on with a cushioned footbed and a gum outsole for grip and style.",
    tags: ["casual", "slip-on", "new"],
    colors: [{ name: "Navy", hex: "#1f3a5f" }],
    sizes: ["6", "7", "8", "9"],
    flags: { isNewArrival: true },
  },
  {
    name: "Zoom-X Sprint",
    slug: "zoom-x-sprint",
    categorySlug: "sports-shoes",
    gender: Gender.MEN,
    basePrice: 159,
    shortDesc: "Race-day speed and rebound.",
    description:
      "Built for tempo runs and race day with a propulsive foam and a lockdown fit.",
    tags: ["running", "performance"],
    colors: [
      { name: "Teal", hex: "#0d7f8f" },
      { name: "Black", hex: "#12232a" },
    ],
    sizes: ["8", "9", "10", "11", "12"],
    flags: { isNewArrival: true, isFeatured: true },
  },
  {
    name: "Court Classic Oxford",
    slug: "court-classic-oxford",
    categorySlug: "oxford",
    gender: Gender.MEN,
    basePrice: 149,
    shortDesc: "Clean leather everyday formal.",
    description:
      "A refined leather Oxford with a cushioned insole — dressy enough for the office, comfortable enough for the commute.",
    tags: ["formal", "leather"],
    colors: [{ name: "Brown", hex: "#6b4a2b" }],
    sizes: ["8", "9", "10", "11"],
  },
  {
    name: "The Joyride",
    slug: "the-joyride",
    categorySlug: "sneakers",
    gender: Gender.UNISEX,
    basePrice: 390,
    shortDesc: "Bead-cushioned statement sneaker.",
    description:
      "A statement sneaker with bead-based cushioning that adapts to every step. Our weekly pick.",
    tags: ["premium", "cushioned"],
    colors: [
      { name: "Coral", hex: "#e8825f" },
      { name: "Teal", hex: "#0d7f8f" },
    ],
    sizes: ["41", "42", "43", "44"],
    flags: { isWeeklyPick: true, isFeatured: true },
  },
  {
    name: "Trail Blaze GTX",
    slug: "trail-blaze-gtx",
    categorySlug: "sports-shoes",
    gender: Gender.MEN,
    basePrice: 179,
    salePrice: 129,
    shortDesc: "Grippy weatherproof trail shoe.",
    description:
      "An aggressive-lug trail shoe with a weatherproof membrane for wet and technical terrain.",
    tags: ["trail", "waterproof", "sale"],
    colors: [{ name: "Olive", hex: "#5b6b3a" }],
    sizes: ["9", "10", "11", "12"],
    flags: { isOnSale: true },
  },
  {
    name: "Metro Knit Slip",
    slug: "metro-knit-slip",
    categorySlug: "sneakers",
    gender: Gender.WOMEN,
    basePrice: 99,
    salePrice: 69,
    shortDesc: "Breathable knit city shoe.",
    description:
      "A breathable knit slip-on for the city — packable, washable, and endlessly comfortable.",
    tags: ["casual", "knit", "sale"],
    colors: [
      { name: "Grey", hex: "#8a9aa0" },
      { name: "Coral", hex: "#e8825f" },
    ],
    sizes: ["6", "7", "8", "9"],
    flags: { isOnSale: true },
  },
  {
    name: "Heritage Derby",
    slug: "heritage-derby",
    categorySlug: "oxford",
    gender: Gender.MEN,
    basePrice: 165,
    shortDesc: "Waxed-leather derby.",
    description:
      "A waxed-leather derby with Goodyear-style welting for durability and a timeless silhouette.",
    tags: ["formal", "leather"],
    colors: [{ name: "Black", hex: "#12232a" }],
    sizes: ["8", "9", "10", "11"],
  },
  // ---- clothing: same model, apparel sizes (S/M/L/XL) ----
  {
    name: "Everyday Oxford Shirt",
    slug: "everyday-oxford-shirt",
    categorySlug: "shirts",
    gender: Gender.MEN,
    basePrice: 49,
    shortDesc: "Breathable cotton button-down.",
    description:
      "A crisp cotton Oxford shirt with a tailored fit — works for the office or the weekend.",
    tags: ["cotton", "slim-fit", "new"],
    colors: [
      { name: "White", hex: "#f4f7f8" },
      { name: "Sky", hex: "#7fb2c9" },
    ],
    sizes: ["S", "M", "L", "XL"],
    flags: { isNewArrival: true },
  },
  {
    name: "Linen Weekend Shirt",
    slug: "linen-weekend-shirt",
    categorySlug: "shirts",
    gender: Gender.WOMEN,
    basePrice: 55,
    salePrice: 39,
    shortDesc: "Relaxed breathable linen.",
    description:
      "A relaxed-fit linen shirt that keeps you cool — perfect for warm days.",
    tags: ["linen", "relaxed", "sale"],
    colors: [{ name: "Sand", hex: "#d8c3a5" }],
    sizes: ["S", "M", "L"],
    flags: { isOnSale: true },
  },
  {
    name: "Slim Chino Trousers",
    slug: "slim-chino-trousers",
    categorySlug: "trousers",
    gender: Gender.MEN,
    basePrice: 69,
    shortDesc: "Stretch cotton chinos.",
    description:
      "Slim-fit stretch chinos with a clean finish — comfortable enough to wear all day.",
    tags: ["cotton", "slim-fit"],
    colors: [
      { name: "Navy", hex: "#1f3a5f" },
      { name: "Stone", hex: "#c9bda3" },
    ],
    sizes: ["30", "32", "34", "36"],
    flags: { isFeatured: true, isNewArrival: true },
  },
  {
    name: "Tailored Wool Trousers",
    slug: "tailored-wool-trousers",
    categorySlug: "trousers",
    gender: Gender.WOMEN,
    basePrice: 89,
    shortDesc: "Structured wool-blend.",
    description:
      "Tailored wool-blend trousers with a sharp crease and a comfortable mid-rise.",
    tags: ["wool", "tailored"],
    colors: [{ name: "Charcoal", hex: "#3a3f44" }],
    sizes: ["6", "8", "10", "12"],
  },
];

async function main() {
  console.log("Seeding Shoe Express…");

  // ---- admin ----
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@shoeexpress.test";
  const adminPass = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPass, 10),
      name: "Store Admin",
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`  admin: ${adminEmail} / ${adminPass}`);

  // ---- demo customer ----
  const customerEmail = "customer@shoeexpress.test";
  await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      email: customerEmail,
      passwordHash: await bcrypt.hash("customer123", 10),
      name: "Demo Customer",
      role: Role.CUSTOMER,
    },
  });
  console.log(`  customer: ${customerEmail} / customer123`);

  // ---- settings ----
  if (!(await prisma.siteSettings.findFirst())) {
    await prisma.siteSettings.create({
      data: {
        storeName: "Shoe Express",
        currency: "USD",
        contactEmail: "hello@shoeexpress.test",
        flatShipping: 5.0,
        freeShippingThreshold: 100.0,
        taxRate: 0.0,
        socials: { instagram: "#", facebook: "#", youtube: "#" },
      },
    });
  }

  // ---- categories ----
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  // ---- brand ----
  const brand = await prisma.brand.upsert({
    where: { slug: "express-athletics" },
    update: {},
    create: { name: "Express Athletics", slug: "express-athletics" },
  });

  // ---- products ----
  let weeklyPickId: string | null = null;

  for (const p of PRODUCTS) {
    const category = await prisma.category.findUnique({
      where: { slug: p.categorySlug },
    });
    if (!category) continue;

    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
    });
    if (existing) {
      if (p.flags?.isWeeklyPick) weeklyPickId = existing.id;
      continue;
    }

    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDesc: p.shortDesc,
        gender: p.gender,
        basePrice: p.basePrice,
        salePrice: p.salePrice ?? null,
        sku: p.slug.toUpperCase(),
        tags: p.tags,
        isPublished: true,
        isFeatured: p.flags?.isFeatured ?? false,
        isNewArrival: p.flags?.isNewArrival ?? false,
        isWeeklyPick: p.flags?.isWeeklyPick ?? false,
        isOnSale: p.flags?.isOnSale ?? false,
        brandId: brand.id,
        categoryId: category.id,
        colors: { create: p.colors },
        sizes: { create: p.sizes.map((label) => ({ label })) },
      },
      include: { colors: true, sizes: true },
    });

    // variants = colors × sizes, each with inventory
    for (const color of product.colors) {
      for (const size of product.sizes) {
        await prisma.productVariant.create({
          data: {
            sku: `${product.sku}-${color.name}-${size.label}`,
            productId: product.id,
            colorId: color.id,
            sizeId: size.id,
            inventory: {
              create: { available: 20, lowStockAt: 5 },
            },
          },
        });
      }
    }

    // gallery images (3 branded placeholders per product, shipped in /public)
    for (let i = 0; i < 3; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `/products/${product.slug}-${i + 1}.svg`,
          alt: `${product.name} — view ${i + 1}`,
          position: i,
          isPrimary: i === 0,
        },
      });
    }

    if (p.flags?.isWeeklyPick) weeklyPickId = product.id;
    console.log(`  product: ${p.name}`);
  }

  // ---- homepage CMS ----
  const existingHome = await prisma.homepage.findFirst();
  if (!existingHome) {
    await prisma.homepage.create({
      data: {
        heroHeading: "SPORTS SHOES",
        heroSubheading: "Men's collection",
        heroDescription:
          "Discover premium footwear designed for movement, comfort and everyday style.",
        heroCtaLabel: "Shop Now",
        heroCtaUrl: "/shop",
        weeklyPickHeading: "OUR WEEKLY PICK",
        weeklyPickDesc: "Hand-picked by our team, refreshed every week.",
        weeklyPickProductId: weeklyPickId,
        membershipHeading: "Become a member and get 20% off",
        membershipCtaLabel: "Sign up for free now",
        membershipCtaUrl: "/register",
        slides: {
          create: [
            { imageUrl: "/hero/hero-1.svg", position: 0, isActive: true },
            { imageUrl: "/hero/hero-2.svg", position: 1, isActive: true },
            { imageUrl: "/hero/hero-3.svg", position: 2, isActive: true },
          ],
        },
      },
    });
  } else if (weeklyPickId && !existingHome.weeklyPickProductId) {
    await prisma.homepage.update({
      where: { id: existingHome.id },
      data: { weeklyPickProductId: weeklyPickId },
    });
  }

  // ---- sample approved reviews (so ratings render) ----
  const reviewCustomer = await prisma.user.findUnique({
    where: { email: customerEmail },
  });
  const reviewTargets = await prisma.product.findMany({
    where: { isPublished: true },
    take: 4,
  });
  if (reviewCustomer) {
    for (const [i, prod] of reviewTargets.entries()) {
      const existing = await prisma.review.findFirst({
        where: { productId: prod.id, userId: reviewCustomer.id },
      });
      if (!existing) {
        await prisma.review.create({
          data: {
            productId: prod.id,
            userId: reviewCustomer.id,
            rating: 5 - (i % 2),
            title: i % 2 === 0 ? "Excellent" : "Really comfortable",
            comment:
              "Great fit and quality — exactly what I expected. Would buy again.",
            isApproved: true,
          },
        });
      }
    }
    console.log("  reviews: seeded sample approved reviews");
  }

  // ---- sample coupon ----
  await prisma.coupon.upsert({
    where: { code: "WELCOME20" },
    update: {},
    create: {
      code: "WELCOME20",
      type: "PERCENT",
      value: 20,
      minOrder: 50,
      isActive: true,
    },
  });
  console.log("  coupon: WELCOME20 (20% off orders over $50)");

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
