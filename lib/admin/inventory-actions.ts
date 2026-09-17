"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { z } from "zod";

const schema = z.object({
  variantId: z.string().min(1),
  available: z.coerce.number().int().min(0, "Stock cannot be negative"),
  lowStockAt: z.coerce.number().int().min(0).optional(),
});

export async function setInventory(input: {
  variantId: string;
  available: number;
  lowStockAt?: number;
}) {
  const admin = await requirePermission("products.write");
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const { variantId, available, lowStockAt } = parsed.data;

  await prisma.inventory.upsert({
    where: { variantId },
    update: { available, ...(lowStockAt != null ? { lowStockAt } : {}) },
    create: { variantId, available, lowStockAt: lowStockAt ?? 5 },
  });

  await logActivity({
    userId: admin.id,
    action: "inventory.updated",
    entity: "Inventory",
    entityId: variantId,
    meta: { available },
  });

  revalidatePath("/admin/inventory");
  return { ok: true };
}
