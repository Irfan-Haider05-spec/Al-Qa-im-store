import { prisma } from "@/lib/db/prisma";

export type ReviewEligibility = "signed-out" | "not-purchased" | "reviewed" | "eligible";

/** The customer's most recent delivered order that contained this product. */
export function findReviewableOrder(productId: string, userId: string) {
  return prisma.order.findFirst({
    where: {
      userId,
      status: "DELIVERED",
      items: { some: { variant: { productId } } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
}

/** Decides which review prompt a product page shows this visitor. */
export async function getReviewEligibility(
  productId: string,
  userId: string | null
): Promise<ReviewEligibility> {
  if (!userId) return "signed-out";

  const [existing, order] = await Promise.all([
    prisma.review.findFirst({ where: { productId, userId }, select: { id: true } }),
    findReviewableOrder(productId, userId),
  ]);

  if (existing) return "reviewed";
  return order ? "eligible" : "not-purchased";
}
