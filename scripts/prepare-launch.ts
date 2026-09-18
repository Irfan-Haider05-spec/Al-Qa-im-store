/**
 * Clears the seed's demo data out of a database before the store goes live.
 *
 *   npm run launch:prepare                      # dry run: shows what would change
 *   npm run launch:prepare -- --apply           # removes demo customers, orders, reviews
 *   npm run launch:prepare -- --apply --catalog # …and unpublishes the demo products
 *
 * What counts as demo data is exactly what `prisma/seed.ts` creates: the demo
 * customer, the @example.com review authors, their orders and reviews, and the
 * expired sample coupon. Admin accounts, settings, homepage copy, categories
 * and anything you created yourself are never touched.
 *
 * `--catalog` unpublishes (does not delete) every product that was seeded, so
 * the shop starts empty and fills with your own listings; you can delete the
 * demo products from Admin → Products whenever you like. Hero slides that
 * pointed at them keep their photo but lose the price caption, and can be
 * replaced in Admin → Homepage.
 */
import { PrismaClient } from "@prisma/client";
import { PRODUCTS } from "../prisma/catalog";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const catalog = process.argv.includes("--catalog");

const DEMO_CUSTOMER = "customer@alqaim.test";

async function main() {
  const demoUsers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      OR: [
        { email: { equals: DEMO_CUSTOMER, mode: "insensitive" } },
        { email: { endsWith: "@example.com", mode: "insensitive" } },
      ],
    },
    select: { id: true, email: true },
  });
  const ids = demoUsers.map((u) => u.id);

  const [orders, reviews, carts] = await Promise.all([
    prisma.order.count({ where: { userId: { in: ids } } }),
    prisma.review.count({ where: { userId: { in: ids } } }),
    prisma.cart.findMany({ where: { userId: { in: ids } }, select: { id: true } }),
  ]);

  const demoSlugs = PRODUCTS.map((p) => p.slug);
  const publishedDemo = catalog
    ? await prisma.product.count({ where: { slug: { in: demoSlugs }, isPublished: true } })
    : 0;

  console.log(apply ? "Applying:" : "Dry run — nothing will change. Add --apply to proceed.\n");
  console.log(`  demo customers   ${demoUsers.length}`);
  for (const u of demoUsers) console.log(`                   - ${u.email}`);
  console.log(`  their orders     ${orders}`);
  console.log(`  their reviews    ${reviews}`);
  console.log(`  expired coupon   EXPIRED10`);
  if (catalog) console.log(`  demo products    ${publishedDemo} to unpublish`);

  if (!apply) return;

  await prisma.$transaction(async (tx) => {
    // Order items, payments and coupon usages cascade with their order.
    await tx.order.deleteMany({ where: { userId: { in: ids } } });
    await tx.review.deleteMany({ where: { userId: { in: ids } } });
    await tx.cartItem.deleteMany({ where: { cartId: { in: carts.map((c) => c.id) } } });
    await tx.cart.deleteMany({ where: { userId: { in: ids } } });
    // Addresses and wishlists cascade with the user.
    await tx.user.deleteMany({ where: { id: { in: ids } } });
    await tx.coupon.deleteMany({ where: { code: "EXPIRED10" } });

    if (catalog) {
      await tx.product.updateMany({
        where: { slug: { in: demoSlugs } },
        data: { isPublished: false, isFeatured: false, isNewArrival: false, isWeeklyPick: false },
      });
    }
  });

  console.log("\nDone. Review your coupons in Admin → Coupons (WELCOME20 and FREESHIP are samples).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
