import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-control bg-muted", className)}
      aria-hidden
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}
