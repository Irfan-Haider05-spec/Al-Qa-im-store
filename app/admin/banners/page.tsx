import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { BannerManager } from "@/components/admin/banner-manager";

export default async function AdminBannersPage() {
  await requirePermission("homepage.write");
  const banners = await prisma.banner.findMany({ orderBy: { title: "asc" } });
  return (
    <div>
      <PageHeader title="Banners" description="Promotional banners with scheduling" />
      <BannerManager banners={banners} />
    </div>
  );
}
