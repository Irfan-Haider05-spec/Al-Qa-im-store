import { requireAdmin } from "@/lib/auth/session";
import { logout } from "@/lib/auth/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { ToastProvider } from "@/components/ui/toast";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Coarse guard; middleware blocks the route too, and every mutation
  // re-checks the caller's specific permission server-side.
  const user = await requireAdmin();

  return (
    <ToastProvider>
      <AdminShell
        userLabel={user.name ?? user.email ?? "Admin"}
        role={String(user.role)}
        logoutForm={
          <form action={logout}>
            <button
              type="submit"
              className="rounded-control border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              Log out
            </button>
          </form>
        }
      >
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
