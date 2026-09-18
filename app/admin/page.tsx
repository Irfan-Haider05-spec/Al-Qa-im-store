import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

/** Land each role on the first section it is allowed to open. */
export default async function AdminIndex() {
  const user = await requireAdmin();
  if (can(user.role, "orders.read")) redirect("/admin/dashboard");
  if (can(user.role, "products.read")) redirect("/admin/products");
  if (can(user.role, "homepage.write")) redirect("/admin/homepage");
  redirect("/");
}
