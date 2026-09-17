import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { StatCard, PageHeader } from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  await requirePermission("orders.read");

  const [
    revenueAgg,
    orderCount,
    pendingCount,
    customerCount,
    productCount,
    lowStock,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.inventory.findMany({
      where: { available: { lte: 5 } },
      include: {
        variant: {
          include: { product: true, color: true, size: true },
        },
      },
      orderBy: { available: "asc" },
      take: 6,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { items: true } } },
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const revenue = Number(revenueAgg._sum.total ?? 0);

  return (
    <div>
      <PageHeader title="Dashboard" description="Store performance at a glance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Revenue" value={formatPrice(revenue)} />
        <StatCard label="Orders" value={orderCount} />
        <StatCard label="Pending" value={pendingCount} hint="Awaiting action" />
        <StatCard label="Customers" value={customerCount} />
        <StatCard label="Products" value={productCount} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-card border border-border bg-background">
              {recentOrders.map(
                (o: {
                  id: string;
                  orderNumber: string;
                  status: string;
                  total: unknown;
                  createdAt: Date;
                  _count: { items: number };
                }) => (
                  <li key={o.id}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30"
                    >
                      <div>
                        <p className="text-sm font-medium">{o.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString()} ·{" "}
                          {o._count.items} {o._count.items === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <Badge tone="muted">{o.status}</Badge>
                      <span className="text-sm font-semibold">
                        {formatPrice(Number(o.total))}
                      </span>
                    </Link>
                  </li>
                )
              )}
            </ul>
          )}
        </section>

        {/* Side column */}
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">
              Top products
            </h2>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <ul className="space-y-2 rounded-card border border-border bg-background p-4">
                {topProducts.map(
                  (p: { productName: string; _sum: { quantity: number | null } }) => (
                    <li
                      key={p.productName}
                      className="flex justify-between text-sm"
                    >
                      <span className="truncate">{p.productName}</span>
                      <span className="font-medium text-muted-foreground">
                        {p._sum.quantity ?? 0} sold
                      </span>
                    </li>
                  )
                )}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">
              Low stock
            </h2>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Everything is well stocked.
              </p>
            ) : (
              <ul className="space-y-2 rounded-card border border-border bg-background p-4">
                {lowStock.map(
                  (i: {
                    id: string;
                    available: number;
                    variant: {
                      sku: string;
                      product: { name: string };
                      color: { name: string } | null;
                      size: { label: string } | null;
                    };
                  }) => (
                    <li key={i.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate">{i.variant.product.name}</span>
                        {/* Without the variant these rows read as the same
                            product listed five times. */}
                        <span className="block truncate text-xs text-muted-foreground">
                          {[i.variant.color?.name, i.variant.size?.label]
                            .filter(Boolean)
                            .join(" · ") || i.variant.sku}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 font-medium ${
                          i.available === 0 ? "text-danger" : "text-warning"
                        }`}
                      >
                        {i.available === 0 ? "Out of stock" : `${i.available} left`}
                      </span>
                    </li>
                  )
                )}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
