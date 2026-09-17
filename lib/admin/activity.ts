import { prisma } from "@/lib/db/prisma";

// Record an admin action for the audit trail. Best-effort — never blocks the
// primary operation if logging fails.
export async function logActivity(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await prisma.adminActivityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        meta: params.meta ? (params.meta as object) : undefined,
      },
    });
  } catch {
    // swallow — audit logging must never break the action it records
  }
}
