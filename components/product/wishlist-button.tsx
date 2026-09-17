"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/lib/account/wishlist-actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

/**
 * Saves a product to the wishlist. Optimistic — the heart fills immediately and
 * reverts if the server rejects, so the control never feels laggy on a card.
 */
export function WishlistButton({
  productId,
  productName,
  initialSaved = false,
  className,
  variant = "icon",
}: {
  productId: string;
  productName: string;
  initialSaved?: boolean;
  className?: string;
  variant?: "icon" | "labelled";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const onClick = () => {
    const optimistic = !saved;
    setSaved(optimistic);

    startTransition(async () => {
      const result = await toggleWishlist(productId);

      if (!result.ok) {
        setSaved(!optimistic);
        if ("requiresAuth" in result) {
          toast("Sign in to save items to your wishlist.", "info");
          router.push(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        toast(result.error, "error");
        return;
      }

      setSaved(result.saved);
      toast(
        result.saved
          ? `${productName} saved to your wishlist.`
          : `${productName} removed from your wishlist.`
      );
    });
  };

  if (variant === "labelled") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-pill border border-border px-6 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:opacity-60",
          saved && "border-accent text-accent",
          className
        )}
      >
        <Heart className={cn("h-4 w-4", saved && "fill-accent")} aria-hidden />
        {saved ? "Saved" : "Add to wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-background/95 text-foreground/70 shadow-card backdrop-blur transition-all hover:text-accent disabled:opacity-60",
        // Always visible on touch, revealed on hover for pointer devices.
        "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
        saved && "text-accent md:opacity-100",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-accent")} aria-hidden />
    </button>
  );
}
