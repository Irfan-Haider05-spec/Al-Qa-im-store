import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToastProvider } from "@/components/ui/toast";
import { getCart } from "@/lib/cart/get-cart";
import { getCurrentUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/settings/site";
import { getCategoryTree } from "@/lib/products/queries";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ itemCount }, user, settings, categories] = await Promise.all([
    getCart(),
    getCurrentUser(),
    getSiteSettings(),
    getCategoryTree().catch(() => []),
  ]);

  // The announcement is built from the real shipping settings, so it can
  // never promise a threshold the checkout doesn't honour.
  const announcement =
    settings.freeShippingThreshold != null
      ? `Complimentary delivery over ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: settings.currency,
          maximumFractionDigits: 0,
        }).format(settings.freeShippingThreshold)} · 30-day returns`
      : "30-day returns on every order";

  return (
    <ToastProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-control focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>

      <Header
        cartCount={itemCount}
        storeName={settings.storeName}
        logoUrl={settings.logoUrl}
        departments={categories.map((d) => ({
          slug: d.slug,
          name: d.name,
          imageUrl: d.imageUrl,
          children: d.children.map((c) => ({ slug: c.slug, name: c.name })),
        }))}
        signedIn={Boolean(user)}
        currency={settings.currency}
        announcement={announcement}
      />

      <main id="main">{children}</main>

      <Footer />
    </ToastProvider>
  );
}
