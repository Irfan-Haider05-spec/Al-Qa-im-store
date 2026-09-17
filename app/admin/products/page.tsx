import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/format";
import { totalStock } from "@/lib/products/pricing";

type Row = {
  id: string;
  name: string;
  slug: string;
  basePrice: unknown;
  salePrice: unknown;
  isPublished: boolean;
  category: { name: string } | null;
  variants: { inventory: { available: number } | null }[];
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("products.read");
  const { q } = await searchParams;

  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      category: { select: { name: true } },
      variants: { include: { inventory: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const columns: Column<Row>[] = [
    {
      header: "Product",
      cell: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.slug}</p>
        </div>
      ),
    },
    { header: "Category", cell: (r) => r.category?.name ?? "—" },
    {
      header: "Price",
      cell: (r) =>
        r.salePrice != null ? (
          <span>
            {formatPrice(Number(r.salePrice))}{" "}
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(Number(r.basePrice))}
            </span>
          </span>
        ) : (
          formatPrice(Number(r.basePrice))
        ),
    },
    { header: "Stock", cell: (r) => totalStock(r.variants) },
    {
      header: "Status",
      cell: (r) =>
        r.isPublished ? (
          <Badge tone="success">Published</Badge>
        ) : (
          <Badge tone="muted">Draft</Badge>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${products.length} total`}
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center gap-2 rounded-pill bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-deep"
          >
            <Plus className="h-4 w-4" /> New product
          </Link>
        }
      />

      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products…"
          className="w-full max-w-sm rounded-control border border-border px-3 py-2 text-sm"
        />
      </form>

      <DataTable
        columns={columns}
        rows={products as Row[]}
        rowHref={(r) => `/admin/products/${r.id}`}
        empty="No products found."
      />
    </div>
  );
}
