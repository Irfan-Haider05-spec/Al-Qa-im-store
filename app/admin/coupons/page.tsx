import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { CouponManager } from "@/components/admin/coupon-manager";

export default async function AdminCouponsPage() {
  await requirePermission("settings.write");
  const coupons = await prisma.coupon.findMany({
    include: { _count: { select: { usages: true } } },
    orderBy: { code: "asc" },
  });
  return (
    <div>
      <PageHeader title="Coupons" description={`${coupons.length} total`} />
      <CouponManager coupons={coupons} />
    </div>
  );
}
