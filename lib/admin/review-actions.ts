"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/cache/storefront";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";

export async function approveReview(id: string) {
  const admin = await requirePermission("reviews.moderate");
  const review = await prisma.review.update({
    where: { id },
    data: { isApproved: true },
  });
  await logActivity({
    userId: admin.id,
    action: "review.approved",
    entity: "Review",
    entityId: id,
  });
  revalidatePath("/admin/reviews");
  revalidatePath(`/products`); // review counts/ratings surface on PDPs
  revalidateStorefront(); // featured reviews on the homepage
  return { ok: true, productId: review.productId };
}

export async function rejectReview(id: string) {
  const admin = await requirePermission("reviews.moderate");
  await prisma.review.update({ where: { id }, data: { isApproved: false } });
  await logActivity({
    userId: admin.id,
    action: "review.rejected",
    entity: "Review",
    entityId: id,
  });
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function deleteReview(id: string) {
  const admin = await requirePermission("reviews.moderate");
  await prisma.review.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "review.deleted",
    entity: "Review",
    entityId: id,
  });
  revalidatePath("/admin/reviews");
  return { ok: true };
}
