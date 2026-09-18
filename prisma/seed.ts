/**
 * Seeds a complete, believable store: catalogue, variants with real stock
 * levels, moderated reviews, past orders, CMS content and site settings.
 *
 *   npm run db:seed
 *
 * Safe to re-run — everything upserts on a natural key, so an existing store
 * keeps its edits (a product you renamed in Admin is not clobbered) while
 * anything missing is filled in.
 */
import { PrismaClient, Gender, Role, OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BANNERS, BRANDS, CATEGORIES, HERO_SLIDES, PRODUCTS } from "./catalog";

const prisma = new PrismaClient();

const DEFAULT_STOCK = 24;
const LOW_STOCK = 3;

/** Deterministic pseudo-random so re-seeding produces the same demo store. */
function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const REVIEW_COPY = [
  { rating: 5, title: "Exactly as described", comment: "Turned up in two days, fit true to size and the quality is well above what I expected at this price. Second pair ordered." },
  { rating: 5, title: "Comfortable straight away", comment: "No break-in at all — wore them for a full day of walking the day they arrived and had no complaints." },
  { rating: 4, title: "Great, but size up", comment: "Really well made and the colour is accurate to the photos. They run a touch narrow, so go up half a size if you have wide feet." },
  { rating: 5, title: "Worth it", comment: "I hesitated at the price and shouldn't have. Three months of daily wear and they still look new." },
  { rating: 4, title: "Good everyday shoe", comment: "Does what I wanted it to do. The sole is grippier than my last pair which is the main thing for me." },
  { rating: 3, title: "Nice, sole is firm", comment: "Looks great and the leather is lovely, but the sole is firmer than I like for standing all day. Fine for normal wear." },
];

const REVIEWERS = [
  { email: "amelia.hart@example.com", name: "Amelia Hart" },
  { email: "daniel.osei@example.com", name: "Daniel Osei" },
  { email: "priya.raman@example.com", name: "Priya Raman" },
  { email: "marco.silva@example.com", name: "Marco Silva" },
  { email: "jen.whitfield@example.com", name: "Jen Whitfield" },
];

async function seedUsers() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@alqaim.test";
  const adminPass = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  // A live store must never be seeded with the well-known default password.
  if (process.env.NODE_ENV === "production" && (!process.env.SEED_ADMIN_PASSWORD || adminPass.length < 12)) {
    throw new Error(
      "Set SEED_ADMIN_PASSWORD (12+ characters) before seeding a production database."
    );
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPass, 12),
      name: "Store Admin",
      role: Role.SUPER_ADMIN,
    },
  });
  // The password is only echoed when it is the documented local default;
  // a real one should not end up in terminal scrollback or CI logs.
  console.log(
    `  admin     ${adminEmail} / ${process.env.SEED_ADMIN_PASSWORD ? "(SEED_ADMIN_PASSWORD)" : adminPass}`
  );

  const customer = await prisma.user.upsert({
    where: { email: "customer@alqaim.test" },
    update: {},
    create: {
      email: "customer@alqaim.test",
      passwordHash: await bcrypt.hash("customer123", 12),
      name: "Demo Customer",
      role: Role.CUSTOMER,
    },
  });
  console.log("  customer  customer@alqaim.test / customer123");

  // A handful of review authors, so ratings aren't all from one account.
  const reviewers = [];
  for (const r of REVIEWERS) {
    reviewers.push(
      await prisma.user.upsert({
        where: { email: r.email },
        update: {},
        create: {
          email: r.email,
          name: r.name,
          passwordHash: await bcrypt.hash("customer123", 12),
          role: Role.CUSTOMER,
        },
      })
    );
  }

  if (!(await prisma.address.findFirst({ where: { userId: customer.id } }))) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        fullName: "Demo Customer",
        phone: "+1 415 555 0134",
        line1: "410 Mission Street",
        line2: "Apt 12B",
        city: "San Francisco",
        state: "CA",
        postalCode: "94105",
        country: "US",
        isDefault: true,
      },
    });
  }

  return { admin, customer, reviewers };
}

async function seedSettings() {
  const existing = await prisma.siteSettings.findFirst();
  if (!existing) {
    await prisma.siteSettings.create({
      data: {
        storeName: "Al-Qa’im",
        currency: "USD",
        contactEmail: "hello@alqaim.test",
        phone: "+1 415 555 0100",
        address: "410 Mission Street, San Francisco, CA 94105",
        flatShipping: 9.0,
        freeShippingThreshold: 100.0,
        taxRate: 0.0,
        // Left empty on purpose: the footer only shows networks that have a
        // real profile URL, added in Admin → Settings.
        socials: { instagram: "", facebook: "", youtube: "" },
      },
    });
    console.log("  settings  created");
  }

  const seoDefaults = [
    {
      pageKey: "home",
      title: "Al-Qa’im — Premium footwear, crafted to be worn",
      description:
        "Sneakers, performance runners, leather Oxfords and waterproof boots, chosen for how they wear rather than how they look on a shelf. Free delivery over $100.",
      ogImageUrl: "/banners/promo-primary.webp",
    },
    {
      pageKey: "shop",
      title: "Shop all footwear",
      description:
        "Browse the full Al-Qa’im range — filter by category, size, colour, price and availability.",
      ogImageUrl: "/banners/promo-primary.webp",
    },
  ];
  for (const seo of seoDefaults) {
    await prisma.sEOSettings.upsert({
      where: { pageKey: seo.pageKey },
      update: {},
      create: seo,
    });
  }
}

async function seedCatalogue() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        seoTitle: c.seoTitle,
        seoDesc: c.seoDesc,
        imageUrl: c.hasImage ? `/categories/${c.slug}.webp` : null,
      },
    });
  }
  console.log(`  category  ${CATEGORIES.length} categories`);

  for (const b of BRANDS) {
    await prisma.brand.upsert({ where: { slug: b.slug }, update: {}, create: b });
  }

  let created = 0;
  for (const p of PRODUCTS) {
    if (await prisma.product.findUnique({ where: { slug: p.slug } })) continue;

    const [category, brand] = await Promise.all([
      prisma.category.findUnique({ where: { slug: p.categorySlug } }),
      prisma.brand.findUnique({ where: { slug: p.brandSlug } }),
    ]);

    const sku = p.slug.toUpperCase().replace(/-/g, "");
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDesc: p.shortDesc,
        gender: p.gender,
        basePrice: p.basePrice,
        salePrice: p.salePrice ?? null,
        sku,
        tags: [...p.tags, p.material.toLowerCase().split(" ")[0]],
        isPublished: true,
        isFeatured: p.flags?.isFeatured ?? false,
        isNewArrival: p.flags?.isNewArrival ?? false,
        isWeeklyPick: p.flags?.isWeeklyPick ?? false,
        isOnSale: p.flags?.isOnSale ?? p.salePrice != null,
        seoTitle: `${p.name} — ${p.shortDesc}`,
        seoDesc: p.description.slice(0, 155),
        ogImageUrl: `/products/${p.slug}-1.webp`,
        brandId: brand?.id ?? null,
        categoryId: category?.id ?? null,
        colors: { create: p.colors },
        sizes: { create: p.sizes.map((label, position) => ({ label, position })) },
        images: {
          create: [0, 1, 2].map((i) => ({
            url: `/products/${p.slug}-${i + 1}.webp`,
            alt: `${p.name} — ${["side profile", "detail", "pair"][i]}`,
            position: i,
            isPrimary: i === 0,
          })),
        },
      },
      include: { colors: true, sizes: true },
    });

    // Variants = colours × sizes. Stock varies per size so the storefront shows
    // genuine "only 3 left" and "sold out" states rather than a flat number.
    for (const color of product.colors) {
      for (const size of product.sizes) {
        const available = p.stock?.out?.includes(size.label)
          ? 0
          : p.stock?.low?.includes(size.label)
            ? LOW_STOCK
            : DEFAULT_STOCK;
        await prisma.productVariant.create({
          data: {
            sku: `${sku}-${color.name.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 6)}-${size.label}`,
            productId: product.id,
            colorId: color.id,
            sizeId: size.id,
            inventory: { create: { available, lowStockAt: 5 } },
          },
        });
      }
    }
    created++;
  }
  console.log(`  product   ${created} created, ${PRODUCTS.length - created} already present`);
}

async function seedReviews(reviewers: { id: string }[]) {
  const products = await prisma.product.findMany({ where: { isPublished: true } });
  let created = 0;

  for (const product of products) {
    const random = seededRandom(product.slug);
    const count = 2 + Math.floor(random() * 3); // 2–4 reviews each

    for (let i = 0; i < count; i++) {
      const reviewer = reviewers[Math.floor(random() * reviewers.length)];
      const copy = REVIEW_COPY[Math.floor(random() * REVIEW_COPY.length)];
      const existing = await prisma.review.findFirst({
        where: { productId: product.id, userId: reviewer.id },
      });
      if (existing) continue;

      await prisma.review.create({
        data: {
          productId: product.id,
          userId: reviewer.id,
          rating: copy.rating,
          title: copy.title,
          comment: copy.comment,
          // One in six stays unapproved so the moderation queue isn't empty.
          isApproved: random() > 0.16,
        },
      });
      created++;
    }
  }
  console.log(`  review    ${created} created`);
}

async function seedOrders(customerId: string) {
  if ((await prisma.order.count()) > 0) {
    console.log("  order     already present");
    return;
  }

  const variants = await prisma.productVariant.findMany({
    include: { product: true, color: true, size: true },
    take: 60,
  });
  if (variants.length === 0) return;

  const address = await prisma.address.findFirst({ where: { userId: customerId } });
  const shippingAddress = {
    fullName: address?.fullName ?? "Demo Customer",
    phone: address?.phone ?? "+1 415 555 0134",
    line1: address?.line1 ?? "410 Mission Street",
    line2: address?.line2 ?? null,
    city: address?.city ?? "San Francisco",
    state: address?.state ?? "CA",
    postalCode: address?.postalCode ?? "94105",
    country: address?.country ?? "US",
  };

  // A spread of statuses and dates so the dashboard charts have a real shape.
  const plan: { status: OrderStatus; daysAgo: number; items: number; paid: boolean }[] = [
    { status: OrderStatus.DELIVERED, daysAgo: 42, items: 2, paid: true },
    { status: OrderStatus.DELIVERED, daysAgo: 31, items: 1, paid: true },
    { status: OrderStatus.DELIVERED, daysAgo: 24, items: 3, paid: true },
    { status: OrderStatus.SHIPPED, daysAgo: 12, items: 1, paid: true },
    { status: OrderStatus.SHIPPED, daysAgo: 9, items: 2, paid: true },
    { status: OrderStatus.PROCESSING, daysAgo: 5, items: 2, paid: true },
    { status: OrderStatus.CONFIRMED, daysAgo: 3, items: 1, paid: true },
    { status: OrderStatus.PENDING, daysAgo: 1, items: 2, paid: false },
    { status: OrderStatus.CANCELLED, daysAgo: 18, items: 1, paid: false },
  ];

  const random = seededRandom("orders");

  for (const [i, spec] of plan.entries()) {
    const createdAt = new Date(Date.now() - spec.daysAgo * 86_400_000);
    const picked = Array.from({ length: spec.items }, () => variants[Math.floor(random() * variants.length)]);

    const items = picked.map((v) => {
      const unitPrice = Number(v.product.salePrice ?? v.product.basePrice);
      const quantity = 1 + Math.floor(random() * 2);
      return {
        variantId: v.id,
        productName: v.product.name,
        variantLabel: [v.color?.name, v.size?.label].filter(Boolean).join(" / "),
        unitPrice,
        quantity,
        lineTotal: unitPrice * quantity,
      };
    });

    const subtotal = items.reduce((n, it) => n + it.lineTotal, 0);
    const shipping = subtotal >= 100 ? 0 : 9;
    const total = subtotal + shipping;

    await prisma.order.create({
      data: {
        orderNumber: `SE-${String(1000 + i)}`,
        userId: customerId,
        status: spec.status,
        subtotal,
        discount: 0,
        shipping,
        tax: 0,
        total,
        shippingAddress,
        createdAt,
        updatedAt: createdAt,
        trackingNumber:
          spec.status === OrderStatus.SHIPPED || spec.status === OrderStatus.DELIVERED
            ? `TRK${900_000 + i}`
            : null,
        items: {
          create: items.map((item) => ({
            variantId: item.variantId,
            productName: item.productName,
            variantLabel: item.variantLabel,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        },
        payment: {
          create: {
            method: PaymentMethod.COD,
            status: spec.paid ? PaymentStatus.PAID : PaymentStatus.PENDING,
            amount: total,
          },
        },
      },
    });
  }
  console.log(`  order     ${plan.length} created`);
}

async function seedCms() {
  const weeklyPick = await prisma.product.findFirst({ where: { isWeeklyPick: true } });
  let homepage = await prisma.homepage.findFirst();

  if (!homepage) {
    homepage = await prisma.homepage.create({
      data: {
        heroHeading: "Sports Shoes",
        heroSubheading: "Men's collection",
        heroDescription:
          "Performance silhouettes and hand-finished classics — chosen for how they feel on the hundredth mile, not just the first.",
        heroCtaLabel: "Shop the collection",
        heroCtaUrl: "/shop",
        weeklyPickHeading: "Our weekly pick",
        weeklyPickDesc: "Chosen by our team every Monday. This week, the one people keep coming back for.",
        weeklyPickProductId: weeklyPick?.id ?? null,
        membershipHeading: "Join the members’ circle",
        membershipCtaLabel: "Sign up for free now",
        membershipCtaUrl: "/register",
      },
    });
    console.log("  homepage  created");
  } else if (weeklyPick && !homepage.weeklyPickProductId) {
    await prisma.homepage.update({
      where: { id: homepage.id },
      data: { weeklyPickProductId: weeklyPick.id },
    });
  }

  if ((await prisma.heroSlide.count({ where: { homepageId: homepage.id } })) === 0) {
    for (const [position, slide] of HERO_SLIDES.entries()) {
      const product = await prisma.product.findUnique({ where: { slug: slide.productSlug } });
      await prisma.heroSlide.create({
        data: {
          homepageId: homepage.id,
          productId: product?.id ?? null,
          imageUrl: slide.imageUrl,
          position,
          durationMs: 3200,
          isActive: true,
        },
      });
    }
    console.log(`  hero      ${HERO_SLIDES.length} slides`);
  }

  if ((await prisma.banner.count()) === 0) {
    for (const banner of BANNERS) {
      await prisma.banner.create({ data: { ...banner, isActive: true } });
    }
    console.log(`  banner    ${BANNERS.length} created`);
  }
}

async function seedCoupons() {
  const coupons = [
    { code: "WELCOME20", type: "PERCENT" as const, value: 20, minOrder: 50, isActive: true },
    { code: "FREESHIP", type: "FIXED" as const, value: 9, minOrder: 40, isActive: true },
    { code: "EXPIRED10", type: "PERCENT" as const, value: 10, minOrder: 0, isActive: true, expiresAt: new Date(Date.now() - 86_400_000) },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: c });
  }
  console.log("  coupon    WELCOME20 (20% over $50), FREESHIP ($9 over $40)");
}

async function main() {
  console.log("Seeding Al-Qa’im…");
  const { customer, reviewers } = await seedUsers();
  await seedSettings();
  await seedCatalogue();
  await seedReviews(reviewers);
  await seedOrders(customer.id);
  await seedCms();
  await seedCoupons();
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
