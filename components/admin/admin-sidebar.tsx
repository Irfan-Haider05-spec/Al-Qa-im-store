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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Homepage", href: "/admin/homepage", icon: Home },
  { label: "Banners", href: "/admin/banners", icon: ImageIcon },
  { label: "SEO", href: "/admin/seo", icon: Search },
  { label: "Users", href: "/admin/users", icon: UserCog },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Activity", href: "/admin/activity", icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      <Link
        href="/"
        className="mb-4 px-3 py-2 font-display text-xl font-bold text-secondary-foreground"
      >
        SHOE<span className="text-primary">EXPRESS</span>
      </Link>
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-secondary-foreground/70 hover:bg-white/5 hover:text-secondary-foreground"
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
