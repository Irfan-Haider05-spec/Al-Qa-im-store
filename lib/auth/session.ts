import { cache } from "react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { can, isAdminRole, type Permission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";

/**
 * The signed-in user, with their role read fresh from the database.
 *
 * The JWT carries the role it was issued with, and a token lives for weeks. If
 * that copy were trusted here, demoting an admin or deleting an account would
 * not take effect until the token expired. Middleware still uses the token for
 * its coarse redirect (it runs on the Edge, without Prisma), but every page and
 * server action authorises against this. Cached per request, so it costs one
 * indexed lookup however many times a render asks.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const row = await prisma.user
    .findUnique({ where: { id }, select: { role: true, name: true, email: true } })
    .catch(() => null);
  if (!row) return null;

  return { ...session.user, id, role: row.role, name: row.name, email: row.email };
});

/** Require a logged-in user; redirect to /login otherwise. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require any admin-area role; redirect to /login otherwise. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) redirect("/login");
  return user;
}

/** Require a specific permission; throws if missing (use in server actions). */
export async function requirePermission(perm: Permission) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, perm)) {
    throw new Error("Forbidden: missing permission " + perm);
  }
  return user;
}
