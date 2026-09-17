import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { formatPrice } from "@/lib/utils/format";

type Row = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  _count: { orders: number };
  orders: { total: unknown }[];
};

export default async function AdminCustomersPage() {
  await requirePermission("customers.read");

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      _count: { select: { orders: true } },
      orders: { select: { total: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const columns: Column<Row>[] = [
    {
      header: "Customer",
      cell: (r) => (
        <div>
          <p className="font-medium">{r.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    { header: "Orders", cell: (r) => r._count.orders },
    {
      header: "Lifetime value",
      cell: (r) =>
        formatPrice(
          r.orders.reduce((a: number, o: { total: unknown }) => a + Number(o.total), 0)
        ),
    },
    {
      header: "Joined",
      cell: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader title="Customers" description={`${customers.length} total`} />
      <DataTable columns={columns} rows={customers as Row[]} empty="No customers yet." />
    </div>
  );
}
