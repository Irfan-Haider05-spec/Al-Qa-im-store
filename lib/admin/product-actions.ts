"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/cache/storefront";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { productFormSchema, type ProductFormInput } from "@/lib/validations/admin";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function toData(input: ProductFormInput) {
  return {
    name: input.name,
    slug: input.slug,
    shortDesc: input.shortDesc || null,
    description: input.description || null,
    gender: input.gender,
    basePrice: input.basePrice,
    salePrice: input.salePrice ?? null,
    sku: input.sku || null,
    categoryId: input.categoryId || null,
    brandId: input.brandId || null,
    tags: input.tags
      ? input.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [],
    isPublished: input.isPublished,
    isFeatured: input.isFeatured,
    isNewArrival: input.isNewArrival,
    isWeeklyPick: input.isWeeklyPick,
    isOnSale: input.isOnSale,
    seoTitle: input.seoTitle || null,
    seoDesc: input.seoDesc || null,
  };
}

export async function createProduct(
  input: ProductFormInput
): Promise<ActionResult> {
  const admin = await requirePermission("products.write");
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  // slug uniqueness
  const clash = await prisma.product.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (clash) return { ok: false, error: "A product with this slug exists." };

  const product = await prisma.product.create({ data: toData(parsed.data) });
  await logActivity({
    userId: admin.id,
    action: "product.created",
    entity: "Product",
    entityId: product.id,
    meta: { name: product.name },
  });

  revalidatePath("/admin/products");
  revalidateStorefront();
  return { ok: true, id: product.id };
}

export async function updateProduct(
  id: string,
  input: ProductFormInput
): Promise<ActionResult> {
  const admin = await requirePermission("products.write");
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  const clash = await prisma.product.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });
  if (clash) return { ok: false, error: "Another product uses this slug." };

  await prisma.product.update({ where: { id }, data: toData(parsed.data) });
  await logActivity({
    userId: admin.id,
    action: "product.updated",
    entity: "Product",
    entityId: id,
    meta: { name: parsed.data.name },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/products/${parsed.data.slug}`);
  revalidateStorefront();
  return { ok: true, id };
}

export async function togglePublish(id: string, publish: boolean) {
  const admin = await requirePermission("products.write");
  await prisma.product.update({
    where: { id },
    data: { isPublished: publish },
  });
  await logActivity({
    userId: admin.id,
    action: publish ? "product.published" : "product.unpublished",
    entity: "Product",
    entityId: id,
  });
  revalidatePath("/admin/products");
  revalidateStorefront();
  return { ok: true };
}

export async function deleteProduct(id: string) {
  const admin = await requirePermission("products.delete");
  await prisma.product.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "product.deleted",
    entity: "Product",
    entityId: id,
  });
  revalidatePath("/admin/products");
  revalidateStorefront();
  return { ok: true };
}

// Server-action form wrappers (redirect on success) for the create/edit forms.
export async function createProductAndRedirect(input: ProductFormInput) {
  const res = await createProduct(input);
  if (res.ok) redirect("/admin/products");
  return res;
}
