import type { Role } from "@prisma/client";

export const PERMISSIONS = [
  "products.read",
  "products.write",
  "products.delete",
  "orders.read",
  "orders.write",
  "customers.read",
  "messages.manage",
  "reviews.moderate",
  "homepage.write",
  "settings.write",
  "users.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],
  ADMIN: [
    "products.read",
    "products.write",
    "products.delete",
    "orders.read",
    "orders.write",
    "customers.read",
    "messages.manage",
    "reviews.moderate",
    "homepage.write",
    "settings.write",
  ],
  MANAGER: [
    "products.read",
    "products.write",
    "orders.read",
    "orders.write",
    "customers.read",
    "messages.manage",
  ],
  EDITOR: ["products.read", "products.write", "homepage.write"],
  CUSTOMER: [],
};

/** True if the role holds the given permission. Check this server-side, always. */
export function can(role: Role, perm: Permission): boolean {
  return ROLE_PERMS[role]?.includes(perm) ?? false;
}

/** Roles allowed into the /admin area at all. */
export function isAdminRole(role: Role): boolean {
  return role !== "CUSTOMER";
}
