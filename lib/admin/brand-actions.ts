"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/cache/storefront";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { brandFormSchema, type BrandFormInput } from "@/lib/validations/admin";

type Result = { ok: true; id?: string } | { ok: false; error: string };

function toData(input: BrandFormInput) {
  return {
    name: input.name,
    slug: input.slug,
    logoUrl: input.logoUrl || null,
    isActive: input.isActive,
    position: input.position,
  };
}

async function clashes(input: BrandFormInput, selfId: string | null) {
  const clash = await prisma.brand.findFirst({
    where: {
      OR: [{ slug: input.slug }, { name: { equals: input.name, mode: "insensitive" } }],
      ...(selfId ? { NOT: { id: selfId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(clash);
}

function refresh() {
  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  revalidateStorefront();
}

export async function createBrand(input: BrandFormInput): Promise<Result> {
  const admin = await requirePermission("products.write");
  const parsed = brandFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  if (await clashes(parsed.data, null)) {
    return { ok: false, error: "A brand with this name or slug already exists." };
  }

  const brand = await prisma.brand.create({ data: toData(parsed.data) });
  await logActivity({
    userId: admin.id,
    action: "brand.created",
    entity: "Brand",
    entityId: brand.id,
    meta: { name: brand.name },
  });
  refresh();
  return { ok: true, id: brand.id };
}

export async function updateBrand(id: string, input: BrandFormInput): Promise<Result> {
  const admin = await requirePermission("products.write");
  const parsed = brandFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  if (await clashes(parsed.data, id)) {
    return { ok: false, error: "Another brand uses this name or slug." };
  }

  await prisma.brand.update({ where: { id }, data: toData(parsed.data) });
  await logActivity({ userId: admin.id, action: "brand.updated", entity: "Brand", entityId: id });
  refresh();
  return { ok: true, id };
}

/**
 * Deleting a brand never deletes products: any products that carried it are
 * simply left without a brand, which the admin is told up front.
 */
export async function deleteBrand(id: string): Promise<Result> {
  const admin = await requirePermission("products.delete");
  const brand = await prisma.brand.findUnique({ where: { id }, select: { name: true } });
  if (!brand) return { ok: false, error: "Brand not found." };

  await prisma.$transaction([
    prisma.product.updateMany({ where: { brandId: id }, data: { brandId: null } }),
    prisma.brand.delete({ where: { id } }),
  ]);
  await logActivity({
    userId: admin.id,
    action: "brand.deleted",
    entity: "Brand",
    entityId: id,
    meta: { name: brand.name },
  });
  refresh();
  return { ok: true };
}
