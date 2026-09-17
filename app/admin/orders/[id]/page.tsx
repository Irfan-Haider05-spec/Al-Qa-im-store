import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { formatPrice } from "@/lib/utils/format";
import { OrderControls } from "@/components/admin/order-controls";

type ShippingAddress = {
  fullName?: string;
  email?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string | null;
  postalCode?: string;
  country?: string;
};

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("orders.read");
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payment: true, user: { select: { email: true } } },
  });
  if (!order) notFound();

  const addr = (order.shippingAddress ?? {}) as ShippingAddress;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to orders
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">{order.orderNumber}</h1>
        <span className="text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* left: items + address */}
        <div className="space-y-6">
          <div className="rounded-card border border-border bg-background">
            <ul className="divide-y divide-border">
              {order.items.map(
                (it: {
                  id: string;
                  productName: string;
                  variantLabel: string | null;
                  quantity: number;
                  unitPrice: unknown;
                }) => (
                  <li key={it.id} className="flex justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="font-medium">{it.productName}</p>
                      {it.variantLabel && (
                        <p className="text-xs text-muted-foreground">
                          {it.variantLabel}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Qty {it.quantity}
                      </p>
                    </div>
                    <span className="font-semibold">
                      {formatPrice(Number(it.unitPrice) * it.quantity)}
                    </span>
                  </li>
                )
              )}
            </ul>
            <dl className="space-y-1 border-t border-border p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPrice(Number(order.subtotal))}</dd>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd>-{formatPrice(Number(order.discount))}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{formatPrice(Number(order.shipping))}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-1 font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(Number(order.total))}</dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-card border border-border bg-background p-5">
              <h3 className="font-display font-semibold">Customer</h3>
              <p className="mt-2 text-sm">{addr.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {order.user?.email ?? addr.email ?? "Guest"}
              </p>
              <p className="text-sm text-muted-foreground">{addr.phone}</p>
            </div>
            <div className="rounded-card border border-border bg-background p-5">
              <h3 className="font-display font-semibold">Ship to</h3>
              <address className="mt-2 space-y-0.5 text-sm not-italic text-muted-foreground">
                <p>{addr.line1}</p>
                {addr.line2 && <p>{addr.line2}</p>}
                <p>
                  {[addr.city, addr.state, addr.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p>{addr.country}</p>
              </address>
            </div>
          </div>
        </div>

        {/* right: controls */}
        <OrderControls
          orderId={order.id}
          status={order.status}
          trackingNumber={order.trackingNumber ?? ""}
          internalNotes={order.internalNotes ?? ""}
        />
      </div>
    </div>
  );
}
