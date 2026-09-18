"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";

export async function setMessageRead(id: string, isRead: boolean) {
  await requirePermission("messages.manage");
  await prisma.contactMessage.updateMany({ where: { id: String(id) }, data: { isRead: !!isRead } });
  revalidatePath("/admin/messages");
  return { ok: true };
}

export async function deleteMessage(id: string) {
  const admin = await requirePermission("messages.manage");
  await prisma.contactMessage.deleteMany({ where: { id: String(id) } });
  await logActivity({
    userId: admin.id,
    action: "message.deleted",
    entity: "ContactMessage",
    entityId: String(id),
  });
  revalidatePath("/admin/messages");
  return { ok: true };
}
