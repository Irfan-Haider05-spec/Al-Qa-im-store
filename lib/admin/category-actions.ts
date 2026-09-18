"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/cache/storefront";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { categoryFormSchema, type CategoryFormInput } from "@/lib/validations/admin";

type Result = { ok: true; id?: string } | { ok: false; error: string };

/**
 * The tree is two levels deep — departments and the categories inside them —
 * because that is what the menus, filters and category pages are built for.
 * Returns an error message, or null when the placement is valid.
 */
async function checkPlacement(
  parentId: string | null,
  selfId: string | null
): Promise<string | null> {
  if (!parentId) return null;
  if (parentId === selfId) return "A category can't be inside itself.";

  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: { parentId: true },
  });
  if (!parent) return "That department no longer exists.";
  if (parent.parentId) return "Choose a department (a top-level category) as the parent.";

  if (selfId) {
    const children = await prisma.category.count({ where: { parentId: selfId } });
    if (children > 0) {
      return "This is a department with categories inside it, so it can't be moved into another one.";
    }
  }
  return null;
}

function toData(input: CategoryFormInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    imageUrl: input.imageUrl || null,
    parentId: input.parentId || null,
    position: input.position,
    isActive: input.isActive,
    seoTitle: input.seoTitle || null,
    seoDesc: input.seoDesc || null,
  };
}

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

  const placement = await checkPlacement(parsed.data.parentId || null, null);
  if (placement) return { ok: false, error: placement };

  const cat = await prisma.category.create({ data: toData(parsed.data) });
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

  const placement = await checkPlacement(parsed.data.parentId || null, id);
  if (placement) return { ok: false, error: placement };

  await prisma.category.update({ where: { id }, data: toData(parsed.data) });
  await logActivity({
    userId: admin.id,
    action: "category.updated",
    entity: "Category",
    entityId: id,
  });
  revalidatePath("/admin/categories");
  revalidateStorefront();
  return { ok: true, id };
}

export async function deleteCategory(id: string): Promise<Result> {
  const admin = await requirePermission("products.delete");
  const [products, children] = await Promise.all([
    prisma.product.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);
  if (children > 0) {
    return {
      ok: false,
      error: `This department has ${children} categor${children === 1 ? "y" : "ies"} inside it. Move or delete those first.`,
    };
  }
  if (products > 0) {
    return {
      ok: false,
      error: `Category has ${products} product(s). Move them to another category first.`,
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
  revalidateStorefront();
  return { ok: true };
}
