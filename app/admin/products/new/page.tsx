import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  await requirePermission("products.write");
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div>
      <PageHeader title="New product" />
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
