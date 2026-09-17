"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { z } from "zod";
import type { Role } from "@prisma/client";

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR", "CUSTOMER"]),
});

export async function setUserRole(input: { userId: string; role: Role }) {
  const admin = await requirePermission("users.manage");
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  // Guard: don't allow removing the last SUPER_ADMIN.
  if (parsed.data.role !== "SUPER_ADMIN") {
    const target = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
    });
    if (target?.role === "SUPER_ADMIN") {
      const superAdmins = await prisma.user.count({
        where: { role: "SUPER_ADMIN" },
      });
      if (superAdmins <= 1) {
        return { ok: false, error: "Cannot demote the last super admin." };
      }
    }
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });
  await logActivity({
    userId: admin.id,
    action: "user.role_changed",
    entity: "User",
    entityId: parsed.data.userId,
    meta: { role: parsed.data.role },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}
