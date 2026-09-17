"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Menu, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

/**
 * Admin chrome: a permanent rail on desktop, a drawer below `lg`.
 *
 * The sidebar itself is shared between the two so the navigation can never
 * drift apart. Logging out is a server action passed down as `logoutForm`,
 * which keeps this component free of any auth imports.
 */
export function AdminShell({
  children,
  userLabel,
  role,
  logoutForm,
}: {
  children: React.ReactNode;
  userLabel: string;
  role: string;
  logoutForm: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-60 overflow-y-auto bg-secondary lg:block">
        <AdminSidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-secondary/60"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute inset-y-0 left-0 w-64 overflow-y-auto bg-secondary"
          >
            <div className="flex justify-end p-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="grid h-9 w-9 place-items-center rounded-control text-secondary-foreground/70 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminSidebar />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
              className="grid h-9 w-9 place-items-center rounded-control border border-border lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-display text-lg font-semibold">Admin</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              View store
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>

            <span className="hidden text-sm text-muted-foreground sm:inline">
              {userLabel}
              <span className="ml-1.5 rounded-pill bg-primary/10 px-2 py-0.5 text-xs text-primary-deep">
                {role}
              </span>
            </span>

            {logoutForm}
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
