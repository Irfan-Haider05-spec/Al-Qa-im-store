import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { getCategoryOptions } from "@/lib/admin/catalog-options";

export default async function NewProductPage() {
  await requirePermission("products.write");
  const [categories, brands] = await Promise.all([
    getCategoryOptions(),
    prisma.brand.findMany({
      select: { id: true, name: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
  ]);
  return (
    <div>
      <PageHeader
        title="New product"
        description="Start with the basics. After saving you'll add photos, sizes, colours and stock."
      />
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
