"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";

async function getOrCreateWishlist(userId: string) {
  let wl = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wl) wl = await prisma.wishlist.create({ data: { userId } });
  return wl;
}

export async function toggleWishlist(productId: string) {
  const user = await requireUser();
  const wl = await getOrCreateWishlist(user.id);

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wl.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({
      data: { wishlistId: wl.id, productId },
    });
  }

  revalidatePath("/account/wishlist");
  return { ok: true, added: !existing };
}

export async function removeFromWishlist(productId: string) {
  const user = await requireUser();
  const wl = await prisma.wishlist.findUnique({ where: { userId: user.id } });
  if (!wl) return { ok: false };
  await prisma.wishlistItem
    .delete({
      where: { wishlistId_productId: { wishlistId: wl.id, productId } },
    })
    .catch(() => {});
  revalidatePath("/account/wishlist");
  return { ok: true };
}
