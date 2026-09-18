"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingCart,
  Users,
  Star,
  Ticket,
  Home,
  Image as ImageIcon,
  Search,
  Settings,
  ScrollText,
  UserCog,
  Inbox,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils/cn";
import { can, type Permission } from "@/lib/auth/permissions";
import { Logo } from "@/components/brand/logo";

// `perm` mirrors the check each page makes, so nobody is shown a link that
// only leads to a "forbidden" error.
const NAV: { label: string; href: string; icon: typeof Home; perm?: Permission }[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, perm: "orders.read" },
  { label: "Products", href: "/admin/products", icon: Package, perm: "products.read" },
  { label: "Categories", href: "/admin/categories", icon: FolderTree, perm: "products.read" },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes, perm: "products.read" },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart, perm: "orders.read" },
  { label: "Customers", href: "/admin/customers", icon: Users, perm: "customers.read" },
  { label: "Messages", href: "/admin/messages", icon: Inbox, perm: "messages.manage" },
  { label: "Reviews", href: "/admin/reviews", icon: Star, perm: "reviews.moderate" },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket, perm: "settings.write" },
  { label: "Homepage", href: "/admin/homepage", icon: Home, perm: "homepage.write" },
  { label: "Banners", href: "/admin/banners", icon: ImageIcon, perm: "homepage.write" },
  { label: "SEO", href: "/admin/seo", icon: Search, perm: "settings.write" },
  { label: "Users", href: "/admin/users", icon: UserCog, perm: "users.manage" },
  { label: "Settings", href: "/admin/settings", icon: Settings, perm: "settings.write" },
  { label: "Activity", href: "/admin/activity", icon: ScrollText, perm: "settings.write" },
];

export function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV.filter((item) => !item.perm || can(role, item.perm));

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      <Link href="/" className="mb-6 px-3 py-3" aria-label="View store">
        <Logo size="sm" />
      </Link>
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors",
              // Gold on the ink rail — `bg-primary` is ink too, and would vanish.
              active
                ? "bg-gold text-ink"
                : "text-secondary-foreground/70 hover:bg-white/5 hover:text-gold-light"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
