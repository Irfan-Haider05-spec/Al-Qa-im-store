import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/utils/format";

export default async function AccountOverviewPage() {
  const user = await requireUser();

  const [orderCount, wishlist, recentOrders] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.wishlist.findUnique({
      where: { userId: user.id },
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const cards = [
    { label: "Orders", value: orderCount, href: "/account/orders" },
    {
      label: "Wishlist items",
      value: wishlist?._count.items ?? 0,
      href: "/account/wishlist",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-card border border-border p-5 hover:shadow-card"
          >
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent orders</h2>
          <Link
            href="/account/orders"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-card border border-border">
            {recentOrders.map((o: { id: string; orderNumber: string; status: string; total: unknown }) => (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted"
                >
                  <span className="text-sm font-medium">{o.orderNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {o.status}
                  </span>
                  <span className="text-sm font-semibold">
                    {formatPrice(Number(o.total))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
