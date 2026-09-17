"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2 } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { approveReview, rejectReview, deleteReview } from "@/lib/admin/review-actions";

export function ReviewRow({
  review,
}: {
  review: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    isApproved: boolean;
    createdAt: Date;
    productName: string;
    userName: string | null;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className="rounded-card border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Rating value={review.rating} showCount={false} size={14} />
            <span className="text-sm font-medium">{review.productName}</span>
            {review.isApproved ? (
              <span className="rounded-pill bg-success/10 px-2 py-0.5 text-xs text-success">
                Approved
              </span>
            ) : (
              <span className="rounded-pill bg-warning/10 px-2 py-0.5 text-xs text-warning">
                Pending
              </span>
            )}
          </div>
          {review.title && <p className="mt-1 font-medium">{review.title}</p>}
          {review.comment && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {review.comment}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {review.userName ?? "Anonymous"} ·{" "}
            {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-none gap-2">
          {!review.isApproved ? (
            <button
              onClick={() => run(() => approveReview(review.id))}
              disabled={pending}
              aria-label="Approve"
              className="grid h-9 w-9 place-items-center rounded-full bg-success/10 text-success hover:bg-success/20"
            >
              <Check className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => run(() => rejectReview(review.id))}
              disabled={pending}
              aria-label="Unapprove"
              className="grid h-9 w-9 place-items-center rounded-full bg-warning/10 text-warning hover:bg-warning/20"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => run(() => deleteReview(review.id))}
            disabled={pending}
            aria-label="Delete"
            className="grid h-9 w-9 place-items-center rounded-full bg-danger/10 text-danger hover:bg-danger/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
