import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { ShopFilterEditor } from "@/components/admin/shop-filter-editor";
import { normaliseFilters } from "@/lib/catalog/shop-filters";

export const metadata = { title: "Shop filters" };

/**
 * Which filter groups the shop sidebar shows, and in what order. The values
 * inside each group (categories, brands, sizes, colours) come from the
 * catalogue itself — manage those on the Categories, Brands and product pages.
 */
export default async function AdminShopFiltersPage() {
  await requirePermission("settings.write");
  const settings = await prisma.siteSettings.findFirst({ select: { shopFilters: true } });

  return (
    <div>
      <PageHeader
        title="Shop filters"
        description="Choose which filters appear in the shop sidebar and in what order. Sizes and colours follow the products in view — shoe sizes in Footwear, S–XL in Clothing."
      />
      <ShopFilterEditor initial={normaliseFilters(settings?.shopFilters)} />
    </div>
  );
}
