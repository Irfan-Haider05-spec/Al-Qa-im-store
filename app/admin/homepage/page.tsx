import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { HomepageEditor } from "@/components/admin/homepage-editor";

export default async function AdminHomepagePage() {
  await requirePermission("homepage.write");

  const [hp, candidates] = await Promise.all([
    prisma.homepage.findFirst(),
    prisma.product.findMany({
      where: { isPublished: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Homepage"
        description="Edit hero, weekly pick and membership — changes go live on the storefront."
      />
      <HomepageEditor
        weeklyPickCandidates={candidates}
        initial={{
          heroHeading: hp?.heroHeading ?? "SPORTS SHOES",
          heroSubheading: hp?.heroSubheading ?? "Men's collection",
          heroDescription: hp?.heroDescription ?? "",
          heroCtaLabel: hp?.heroCtaLabel ?? "Shop Now",
          heroCtaUrl: hp?.heroCtaUrl ?? "/shop",
          weeklyPickHeading: hp?.weeklyPickHeading ?? "OUR WEEKLY PICK",
          weeklyPickDesc: hp?.weeklyPickDesc ?? "",
          weeklyPickProductId: hp?.weeklyPickProductId ?? "",
          membershipHeading: hp?.membershipHeading ?? "",
          membershipCtaLabel: hp?.membershipCtaLabel ?? "",
          membershipCtaUrl: hp?.membershipCtaUrl ?? "",
        }}
      />
    </div>
  );
}
