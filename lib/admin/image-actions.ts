"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";

export async function addProductImage(input: {
  productId: string;
  url: string;
  alt?: string;
}) {
  await requirePermission("products.write");
  if (!input.url) return { ok: false, error: "No image URL" };

  const count = await prisma.productImage.count({
    where: { productId: input.productId },
  });

  await prisma.productImage.create({
    data: {
      productId: input.productId,
      url: input.url,
      alt: input.alt || null,
      position: count,
      isPrimary: count === 0, // first image is primary
    },
  });
  revalidatePath(`/admin/products/${input.productId}`);
  return { ok: true };
}

export async function removeProductImage(id: string, productId: string) {
  await requirePermission("products.write");
  const img = await prisma.productImage.findUnique({ where: { id } });
  await prisma.productImage.delete({ where: { id } });

  // If we removed the primary, promote the next image.
  if (img?.isPrimary) {
    const next = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { position: "asc" },
    });
    if (next) {
      await prisma.productImage.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function setPrimaryImage(id: string, productId: string) {
  await requirePermission("products.write");
  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({ where: { id }, data: { isPrimary: true } }),
  ]);
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}
