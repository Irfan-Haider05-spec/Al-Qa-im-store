import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/format";

type Row = {
  id: string;
  orderNumber: string;
  status: string;
  total: unknown;
  createdAt: Date;
  shippingAddress: unknown;
  _count: { items: number };
};

const STATUS_TONE: Record<string, "primary" | "success" | "warning" | "danger" | "muted"> = {
  PENDING: "warning",
  CONFIRMED: "primary",
  PROCESSING: "primary",
  PACKED: "primary",
  SHIPPED: "primary",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "muted",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("orders.read");
  const { status } = await searchParams;

  const orders = await prisma.order.findMany({
    where: status ? { status: status as never } : undefined,
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  const columns: Column<Row>[] = [
    {
      header: "Order",
      cell: (r) => {
        const addr = (r.shippingAddress ?? {}) as { fullName?: string };
        return (
          <div>
            <p className="font-medium">{r.orderNumber}</p>
            <p className="text-xs text-muted-foreground">
              {addr.fullName ?? "Guest"}
            </p>
          </div>
        );
      },
    },
    {
      header: "Date",
      cell: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    { header: "Items", cell: (r) => r._count.items },
    {
      header: "Status",
      cell: (r) => (
        <Badge tone={STATUS_TONE[r.status] ?? "muted"}>{r.status}</Badge>
      ),
    },
    {
      header: "Total",
      cell: (r) => (
        <span className="font-semibold">{formatPrice(Number(r.total))}</span>
      ),
    },
  ];

  const STATUSES = [
    "",
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ];

  return (
    <div>
      <PageHeader title="Orders" description={`${orders.length} shown`} />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <a
            key={s || "all"}
            href={s ? `/admin/orders?status=${s}` : "/admin/orders"}
            className={`rounded-pill border px-3 py-1.5 text-xs ${
              (status ?? "") === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {s || "All"}
          </a>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={orders as Row[]}
        rowHref={(r) => `/admin/orders/${r.id}`}
        empty="No orders."
      />
    </div>
  );
}
