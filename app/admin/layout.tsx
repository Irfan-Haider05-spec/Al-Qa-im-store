import { requireAdmin } from "@/lib/auth/session";
import { logout } from "@/lib/auth/actions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Coarse guard (middleware also blocks); fine-grained checks live in actions.
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 overflow-y-auto bg-secondary lg:block">
        <AdminSidebar />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <span className="font-display text-lg font-semibold">Admin</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.name ?? user.email}{" "}
              <span className="ml-1 rounded-pill bg-primary/10 px-2 py-0.5 text-xs text-primary-deep">
                {user.role}
              </span>
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-control border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Log out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
