import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { InventoryRow } from "@/components/admin/inventory-row";

export default async function AdminInventoryPage() {
  await requirePermission("products.read");

  const variants = await prisma.productVariant.findMany({
    include: {
      inventory: true,
      color: true,
      size: true,
      product: { select: { name: true } },
    },
    orderBy: { product: { name: "asc" } },
  });

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={`${variants.length} variants`}
      />
      <div className="overflow-x-auto rounded-card border border-border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Product / variant</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Available</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {variants.map(
              (v: {
                id: string;
                sku: string;
                color: { name: string } | null;
                size: { label: string } | null;
                inventory: { available: number; lowStockAt: number } | null;
                product: { name: string };
              }) => (
                <InventoryRow
                  key={v.id}
                  variantId={v.id}
                  sku={v.sku}
                  productName={v.product.name}
                  variantLabel={[v.color?.name, v.size?.label]
                    .filter(Boolean)
                    .join(" · ")}
                  available={v.inventory?.available ?? 0}
                  lowStockAt={v.inventory?.lowStockAt ?? 5}
                />
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
