import { auth } from "@/lib/auth/auth";
import { can, isAdminRole, type Permission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";

/** Get the current session user or null. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

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
