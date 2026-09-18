import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";

type ShippingAddress = {
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string | null;
  postalCode?: string;
  country?: string;
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payment: true },
  });

  // Ownership check — a user can only see their own order (IDOR guard).
  if (!order || order.userId !== user.id) notFound();

  const addr = (order.shippingAddress ?? {}) as ShippingAddress;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/account/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-[1.7rem] font-medium tracking-[-0.01em]">
            {order.orderNumber}
          </h2>
          <Badge tone="primary">{order.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Placed {new Date(order.createdAt).toLocaleString()}
        </p>
        {order.trackingNumber && (
          <p className="mt-1 text-sm">
            Tracking: <span className="font-medium">{order.trackingNumber}</span>
          </p>
        )}
      </div>

      {/* items */}
      <div className="rounded-card border border-border">
        <ul className="divide-y divide-border">
          {order.items.map((it: { id: string; productName: string; variantLabel: string | null; quantity: number; unitPrice: unknown }) => (
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
          ))}
        </ul>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* totals */}
        <div className="rounded-card border border-border p-5">
          <h3 className="font-display font-semibold">Payment</h3>
          <dl className="mt-3 space-y-2 text-sm">
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
              <dd>
                {Number(order.shipping) === 0
                  ? "Free"
                  : formatPrice(Number(order.shipping))}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(Number(order.total))}</dd>
            </div>
            <div className="flex justify-between pt-1 text-xs text-muted-foreground">
              <dt>Method</dt>
              <dd>
                {order.payment?.method} · {order.payment?.status}
              </dd>
            </div>
          </dl>
        </div>

        {/* address */}
        <div className="rounded-card border border-border p-5">
          <h3 className="font-display font-semibold">Shipping to</h3>
          <address className="mt-3 space-y-0.5 text-sm not-italic text-muted-foreground">
            <p className="font-medium text-foreground">{addr.fullName}</p>
            <p>{addr.line1}</p>
            {addr.line2 && <p>{addr.line2}</p>}
            <p>
              {[addr.city, addr.state, addr.postalCode]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p>{addr.country}</p>
            {addr.phone && <p>{addr.phone}</p>}
          </address>
        </div>
      </div>
    </div>
  );
}
