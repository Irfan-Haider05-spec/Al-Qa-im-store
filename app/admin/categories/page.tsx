import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  await requirePermission("products.read");
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true, children: true } } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  const departments = categories.filter((c) => !c.parentId).length;
  return (
    <div>
      <PageHeader
        title="Categories"
        description={`${departments} department${departments === 1 ? "" : "s"} · ${categories.length - departments} categor${categories.length - departments === 1 ? "y" : "ies"}`}
      />
      <CategoryManager categories={categories} />
    </div>
  );
}
