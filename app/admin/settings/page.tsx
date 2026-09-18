import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  await requirePermission("settings.write");
  const s = await prisma.siteSettings.findFirst();
  const socials = (s?.socials ?? {}) as { instagram?: string; facebook?: string; youtube?: string };
  return (
    <div>
      <PageHeader title="Settings" description="Store configuration" />
      <SettingsForm
        initial={{
          storeName: s?.storeName ?? "Al-Qa’im",
          logoUrl: s?.logoUrl ?? "",
          contactEmail: s?.contactEmail ?? "",
          phone: s?.phone ?? "",
          address: s?.address ?? "",
          currency: s?.currency ?? "USD",
          flatShipping: s?.flatShipping != null ? String(Number(s.flatShipping)) : "",
          freeShippingThreshold: s?.freeShippingThreshold != null ? String(Number(s.freeShippingThreshold)) : "",
          taxRate: s?.taxRate != null ? String(Number(s.taxRate)) : "",
          instagram: socials.instagram ?? "",
          facebook: socials.facebook ?? "",
          youtube: socials.youtube ?? "",
        }}
      />
    </div>
  );
}
