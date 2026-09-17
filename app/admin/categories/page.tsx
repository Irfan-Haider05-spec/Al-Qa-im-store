import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  await requirePermission("products.read");
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <PageHeader title="Categories" description={`${categories.length} total`} />
      <CategoryManager categories={categories} />
    </div>
  );
}
