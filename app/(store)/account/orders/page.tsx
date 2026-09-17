import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";

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

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  if (orders.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border p-12 text-center">
        <p className="font-medium">You haven&apos;t placed any orders yet.</p>
        <Link
          href="/shop"
          className="mt-4 inline-flex h-10 items-center rounded-pill bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary-deep"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold">Orders</h2>
      <ul className="divide-y divide-border rounded-card border border-border">
        {orders.map((o: { id: string; orderNumber: string; status: string; total: unknown; createdAt: Date; _count: { items: number } }) => (
          <li key={o.id}>
            <Link
              href={`/account/orders/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 hover:bg-muted"
            >
              <div>
                <p className="font-medium">{o.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString()} ·{" "}
                  {o._count.items} item{o._count.items === 1 ? "" : "s"}
                </p>
              </div>
              <Badge tone={STATUS_TONE[o.status] ?? "muted"}>{o.status}</Badge>
              <span className="font-semibold">
                {formatPrice(Number(o.total))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
