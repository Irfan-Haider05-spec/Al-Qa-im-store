"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";

const RESTOCK_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED"];

const statusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
});

export async function updateOrderStatus(input: {
  orderId: string;
  status: OrderStatus;
}) {
  const admin = await requirePermission("orders.write");
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const { orderId, status } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return { ok: false, error: "Order not found." };

  const wasRestocked = RESTOCK_STATUSES.includes(order.status);
  const willRestock = RESTOCK_STATUSES.includes(status);

  await prisma.$transaction(async (tx) => {
    // Return stock only on the transition INTO a cancelled/refunded state.
    if (!wasRestocked && willRestock) {
      for (const item of order.items) {
        await tx.inventory.updateMany({
          where: { variantId: item.variantId },
          data: { available: { increment: item.quantity } },
        });
      }
    }
    // If moving back OUT of cancelled/refunded, take the stock again.
    if (wasRestocked && !willRestock) {
      for (const item of order.items) {
        await tx.inventory.updateMany({
          where: { variantId: item.variantId },
          data: { available: { decrement: item.quantity } },
        });
      }
    }

    await tx.order.update({ where: { id: orderId }, data: { status } });

    // Keep payment status roughly in sync for refunds.
    if (status === "REFUNDED") {
      await tx.payment.updateMany({
        where: { orderId },
        data: { status: "REFUNDED" },
      });
    }
  });

  await logActivity({
    userId: admin.id,
    action: "order.status_changed",
    entity: "Order",
    entityId: orderId,
    meta: { from: order.status, to: status },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function setTracking(input: {
  orderId: string;
  trackingNumber: string;
}) {
  const admin = await requirePermission("orders.write");
  const trackingNumber = input.trackingNumber.trim();
  await prisma.order.update({
    where: { id: input.orderId },
    data: { trackingNumber: trackingNumber || null },
  });
  await logActivity({
    userId: admin.id,
    action: "order.tracking_set",
    entity: "Order",
    entityId: input.orderId,
  });
  revalidatePath(`/admin/orders/${input.orderId}`);
  return { ok: true };
}

export async function setInternalNotes(input: {
  orderId: string;
  notes: string;
}) {
  await requirePermission("orders.write");
  await prisma.order.update({
    where: { id: input.orderId },
    data: { internalNotes: input.notes.trim() || null },
  });
  revalidatePath(`/admin/orders/${input.orderId}`);
  return { ok: true };
}
