import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToastProvider } from "@/components/ui/toast";
import { getCart } from "@/lib/cart/get-cart";
import { getCurrentUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/settings/site";
import { prisma } from "@/lib/db/prisma";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ itemCount }, user, settings, categories] = await Promise.all([
    getCart(),
    getCurrentUser(),
    getSiteSettings(),
    prisma.category
      .findMany({
        where: { isActive: true },
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
        take: 10,
      })
      .catch(() => []),
  ]);

  return (
    <ToastProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <Header
        cartCount={itemCount}
        storeName={settings.storeName}
        categories={categories}
        signedIn={Boolean(user)}
        currency={settings.currency}
      />

      <main id="main">{children}</main>

      <Footer />
    </ToastProvider>
  );
}
