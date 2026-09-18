import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { BrandManager } from "@/components/admin/brand-manager";

export const metadata = { title: "Brands" };

export default async function AdminBrandsPage() {
  await requirePermission("products.read");
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  return (
    <div>
      <PageHeader title="Brands" description={`${brands.length} total`} />
      <BrandManager brands={brands} />
    </div>
  );
}
