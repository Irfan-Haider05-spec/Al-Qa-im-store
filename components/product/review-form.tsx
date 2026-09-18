"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/lib/reviews/actions";
import { cn } from "@/lib/utils/cn";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <div role="status" className="rounded-card border border-gold/50 bg-gold/5 p-6">
        <p className="font-display text-xl font-medium">Thank you for your review.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          It will appear here once our team has approved it.
        </p>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitReview({ productId, rating, title, comment });
      if (res.ok) setSent(true);
      else setError(res.error);
    });
  }

  const shown = hover || rating;
  const field =
    "w-full rounded-control border border-border bg-background px-3.5 py-2.5 text-sm focus:border-foreground focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="rounded-card border border-border p-6">
      <p className="font-display text-xl font-medium">Write a review</p>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium">Your rating</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="peer sr-only"
              />
              <Star
                aria-hidden
                className={cn(
                  "h-7 w-7 rounded-sm transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                  n <= shown ? "fill-gold text-gold" : "text-border"
                )}
              />
              <span className="sr-only">
                {n} star{n > 1 ? "s" : ""} — {LABELS[n]}
              </span>
            </label>
          ))}
          <span className="ml-2 text-sm text-muted-foreground" aria-hidden>
            {LABELS[shown]}
          </span>
        </div>
      </fieldset>

      <div className="mt-4">
        <label htmlFor="review-title" className="mb-1.5 block text-sm font-medium">
          Headline <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="review-title"
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={field}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium">
          Your review
        </label>
        <textarea
          id="review-comment"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How is the fit, comfort and quality?"
          className={field}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || rating === 0}
        className="mt-5 inline-flex h-11 items-center rounded-pill bg-primary px-7 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-50"
      >
        {pending ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}
