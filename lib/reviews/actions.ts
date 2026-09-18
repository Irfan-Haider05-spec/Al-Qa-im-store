"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { RULES, rateLimit, tooManyMessage } from "@/lib/security/rate-limit";
import { findReviewableOrder } from "@/lib/reviews/eligibility";

const reviewSchema = z.object({
  productId: z.string().min(1).max(64),
  rating: z.coerce.number().int().min(1, "Choose a star rating").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  comment: z
    .string()
    .trim()
    .min(10, "Tell other customers a little more (10 characters minimum)")
    .max(2000, "Please keep it under 2,000 characters"),
});

export type ReviewResult = { ok: true } | { ok: false; error: string };

/**
 * A customer review, from someone who has actually received the product.
 *
 * Reviews land unapproved and appear once moderated in Admin → Reviews, which
 * is also why the storefront only ever counts approved ones.
 */
export async function submitReview(input: unknown): Promise<ReviewResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to leave a review." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review" };
  }
  const { productId, rating, title, comment } = parsed.data;

  const limited = await rateLimit(`review:${user.id}`, RULES.review);
  if (!limited.ok) return { ok: false, error: tooManyMessage(limited.retryAfterSec) };

  const already = await prisma.review.findFirst({
    where: { productId, userId: user.id },
    select: { id: true },
  });
  if (already) return { ok: false, error: "You have already reviewed this product." };

  const order = await findReviewableOrder(productId, user.id);
  if (!order) {
    return {
      ok: false,
      error: "Reviews open once your order containing this product has been delivered.",
    };
  }

  await prisma.review.create({
    data: {
      productId,
      userId: user.id,
      orderId: order.id,
      rating,
      title: title || null,
      comment,
      isApproved: false,
    },
  });

  revalidatePath("/admin/reviews");
  return { ok: true };
}
