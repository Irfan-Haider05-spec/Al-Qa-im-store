import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCart } from "@/lib/cart/get-cart";
import { prisma } from "@/lib/db/prisma";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { itemCount } = await getCart();

  // Dynamic nav data — categories added in Admin appear here automatically.
  let storeName = "Shoe Express";
  let categories: { slug: string; name: string }[] = [];
  try {
    const [settings, cats] = await Promise.all([
      prisma.siteSettings.findFirst(),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
        take: 10,
      }),
    ]);
    if (settings?.storeName) storeName = settings.storeName;
    categories = cats;
  } catch {
    /* pre-seed fallback */
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Header cartCount={itemCount} storeName={storeName} categories={categories} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
