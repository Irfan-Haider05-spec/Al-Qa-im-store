"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/cache/storefront";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { categoryFormSchema, type CategoryFormInput } from "@/lib/validations/admin";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export async function createCategory(input: CategoryFormInput): Promise<Result> {
  const admin = await requirePermission("products.write");
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const clash = await prisma.category.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (clash) return { ok: false, error: "A category with this slug exists." };

  const cat = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      isActive: parsed.data.isActive,
      seoTitle: parsed.data.seoTitle || null,
      seoDesc: parsed.data.seoDesc || null,
    },
  });
  await logActivity({
    userId: admin.id,
    action: "category.created",
    entity: "Category",
    entityId: cat.id,
    meta: { name: cat.name },
  });
  revalidatePath("/admin/categories");
  // The header menu and homepage grid show categories on every page.
  revalidateStorefront();
  return { ok: true, id: cat.id };
}

export async function updateCategory(
  id: string,
  input: CategoryFormInput
): Promise<Result> {
  const admin = await requirePermission("products.write");
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const clash = await prisma.category.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });
  if (clash) return { ok: false, error: "Another category uses this slug." };

  await prisma.category.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      isActive: parsed.data.isActive,
      seoTitle: parsed.data.seoTitle || null,
      seoDesc: parsed.data.seoDesc || null,
    },
  });
  await logActivity({
    userId: admin.id,
    action: "category.updated",
    entity: "Category",
    entityId: id,
  });
  revalidatePath("/admin/categories");
  // The header menu and homepage grid show categories on every page.
  revalidateStorefront();
  return { ok: true, id };
}

export async function deleteCategory(id: string): Promise<Result> {
  const admin = await requirePermission("products.delete");
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return {
      ok: false,
      error: `Category has ${count} product(s). Reassign them first.`,
    };
  }
  await prisma.category.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "category.deleted",
    entity: "Category",
    entityId: id,
  });
  revalidatePath("/admin/categories");
  // The header menu and homepage grid show categories on every page.
  revalidateStorefront();
  return { ok: true };
}
