"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, requireUser } from "@/lib/auth/session";

export type WishlistResult =
  | { ok: true; saved: boolean }
  | { ok: false; requiresAuth: true }
  | { ok: false; error: string };

async function getOrCreateWishlist(userId: string) {
  const existing = await prisma.wishlist.findUnique({ where: { userId } });
  return existing ?? prisma.wishlist.create({ data: { userId } });
}

/**
 * Adds or removes a product from the signed-in customer's wishlist.
 *
 * Returns `requiresAuth` instead of redirecting so the caller can send the
 * visitor to /login with a sensible `next` param rather than losing the page
 * they were on.
 */
export async function toggleWishlist(productId: string): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, requiresAuth: true };

  const product = await prisma.product.findFirst({
    where: { id: productId, isPublished: true },
    select: { id: true },
  });
  if (!product) return { ok: false, error: "Product not found" };

  const wishlist = await getOrCreateWishlist(user.id);
  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId },
    });
  }

  revalidatePath("/account/wishlist");
  return { ok: true, saved: !existing };
}

export async function removeFromWishlist(productId: string) {
  const user = await requireUser();
  const wishlist = await prisma.wishlist.findUnique({ where: { userId: user.id } });
  if (!wishlist) return { ok: false as const };

  await prisma.wishlistItem
    .delete({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    })
    .catch(() => {});

  revalidatePath("/account/wishlist");
  return { ok: true as const };
}

/** Product ids the current visitor has saved — used to pre-fill heart icons. */
export async function getWishlistProductIds(): Promise<Set<string>> {
  const user = await getCurrentUser();
  if (!user) return new Set();

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: user.id },
    select: { items: { select: { productId: true } } },
  });
  return new Set(wishlist?.items.map((i) => i.productId) ?? []);
}
