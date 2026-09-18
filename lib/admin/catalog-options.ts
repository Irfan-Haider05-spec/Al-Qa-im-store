import { prisma } from "@/lib/db/prisma";

export type CategoryOption = { id: string; name: string; department: string | null };

/**
 * Categories for the product form's picker, grouped under their departments.
 * A department with categories inside isn't offered itself: products belong
 * in a specific category (Shirts), and the department page (Clothing) shows
 * them all anyway.
 */
export async function getCategoryOptions(keepId?: string | null): Promise<CategoryOption[]> {
  const rows = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      parentId: true,
      _count: { select: { children: true } },
    },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  const names = new Map(rows.map((r) => [r.id, r.name]));
  return rows
    // `keepId` keeps a product's current category selectable even if it has
    // since become a department, so saving the form never silently clears it.
    .filter((r) => r.parentId || r._count.children === 0 || r.id === keepId)
    .map((r) => ({
      id: r.id,
      name: r.name,
      department: r.parentId ? (names.get(r.parentId) ?? null) : null,
    }));
}
