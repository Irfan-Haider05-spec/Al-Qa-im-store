import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { SeoForm } from "@/components/admin/seo-form";

export default async function AdminSeoPage() {
  await requirePermission("settings.write");
  const rows = await prisma.sEOSettings.findMany();
  const entries = rows.map((r: { pageKey: string; title: string | null; description: string | null; ogImageUrl: string | null }) => ({
    pageKey: r.pageKey,
    title: r.title ?? "",
    description: r.description ?? "",
    ogImageUrl: r.ogImageUrl ?? "",
  }));
  return (
    <div>
      <PageHeader title="SEO" description="Per-page titles, descriptions and OG images" />
      <SeoForm entries={entries} />
    </div>
  );
}
