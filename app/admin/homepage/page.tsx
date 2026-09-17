import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { HomepageEditor } from "@/components/admin/homepage-editor";
import { HeroSlideManager } from "@/components/admin/hero-slide-manager";

export default async function AdminHomepagePage() {
  await requirePermission("homepage.write");

  const [homepage, products] = await Promise.all([
    prisma.homepage.findFirst({
      include: { slides: { orderBy: { position: "asc" } } },
    }),
    prisma.product.findMany({
      where: { isPublished: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <PageHeader
          title="Homepage"
          description="Hero, weekly pick and membership copy. Saving here updates the storefront immediately."
        />
        <HomepageEditor
          weeklyPickCandidates={products}
          initial={{
            heroHeading: homepage?.heroHeading ?? "SPORTS SHOES",
            heroSubheading: homepage?.heroSubheading ?? "Men's collection",
            heroDescription: homepage?.heroDescription ?? "",
            heroCtaLabel: homepage?.heroCtaLabel ?? "Shop Now",
            heroCtaUrl: homepage?.heroCtaUrl ?? "/shop",
            weeklyPickHeading: homepage?.weeklyPickHeading ?? "OUR WEEKLY PICK",
            weeklyPickDesc: homepage?.weeklyPickDesc ?? "",
            weeklyPickProductId: homepage?.weeklyPickProductId ?? "",
            membershipHeading: homepage?.membershipHeading ?? "",
            membershipCtaLabel: homepage?.membershipCtaLabel ?? "",
            membershipCtaUrl: homepage?.membershipCtaUrl ?? "",
          }}
        />
      </div>

      <HeroSlideManager slides={homepage?.slides ?? []} products={products} />
    </div>
  );
}
