"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { z } from "zod";

const couponSchema = z.object({
  code: z.string().min(2, "Code is required").transform((s) => s.toUpperCase()),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive("Value must be greater than 0"),
  minOrder: z.coerce.number().nonnegative().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  perUserLimit: z.coerce.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CouponInput = z.input<typeof couponSchema>;

export async function createCoupon(input: unknown) {
  const admin = await requirePermission("settings.write");
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;

  const clash = await prisma.coupon.findUnique({ where: { code: d.code } });
  if (clash) return { ok: false, error: "A coupon with this code exists." };

  if (d.type === "PERCENT" && d.value > 100) {
    return { ok: false, error: "Percent discount cannot exceed 100." };
  }

  await prisma.coupon.create({
    data: {
      code: d.code,
      type: d.type,
      value: d.value,
      minOrder: d.minOrder ?? null,
      usageLimit: d.usageLimit ?? null,
      perUserLimit: d.perUserLimit ?? null,
      expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
      isActive: d.isActive,
    },
  });
  await logActivity({
    userId: admin.id,
    action: "coupon.created",
    entity: "Coupon",
    meta: { code: d.code },
  });
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function toggleCoupon(id: string, active: boolean) {
  await requirePermission("settings.write");
  await prisma.coupon.update({ where: { id }, data: { isActive: active } });
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function deleteCoupon(id: string) {
  const admin = await requirePermission("settings.write");
  await prisma.coupon.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "coupon.deleted",
    entity: "Coupon",
    entityId: id,
  });
  revalidatePath("/admin/coupons");
  return { ok: true };
}
