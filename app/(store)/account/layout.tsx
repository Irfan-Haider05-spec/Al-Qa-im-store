import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { logout } from "@/lib/auth/actions";

const NAV = [
  { label: "Overview", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Profile", href: "/account/profile" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-content px-5 pb-20 pt-28 sm:px-8">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold">My Account</h1>
        <p className="mt-1 text-muted-foreground">
          {user.name ?? user.email}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-control px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <form action={logout}>
              <button
                type="submit"
                className="mt-2 block w-full rounded-control px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger/5"
              >
                Log out
              </button>
            </form>
          </nav>
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
