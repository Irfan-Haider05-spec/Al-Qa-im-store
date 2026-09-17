import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { ReviewRow } from "@/components/admin/review-row";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requirePermission("reviews.moderate");
  const { filter } = await searchParams;

  const where =
    filter === "pending"
      ? { isApproved: false }
      : filter === "approved"
        ? { isApproved: true }
        : undefined;

  const reviews = await prisma.review.findMany({
    where,
    include: {
      product: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const tabs = [
    { key: "", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
  ];

  return (
    <div>
      <PageHeader title="Reviews" description={`${reviews.length} shown`} />

      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <a
            key={t.key || "all"}
            href={t.key ? `/admin/reviews?filter=${t.key}` : "/admin/reviews"}
            className={`rounded-pill border px-3 py-1.5 text-xs ${
              (filter ?? "") === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-card border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No reviews.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(
            (r: {
              id: string;
              rating: number;
              title: string | null;
              comment: string | null;
              isApproved: boolean;
              createdAt: Date;
              product: { name: string };
              user: { name: string | null } | null;
            }) => (
              <ReviewRow
                key={r.id}
                review={{
                  id: r.id,
                  rating: r.rating,
                  title: r.title,
                  comment: r.comment,
                  isApproved: r.isApproved,
                  createdAt: r.createdAt,
                  productName: r.product.name,
                  userName: r.user?.name ?? null,
                }}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
