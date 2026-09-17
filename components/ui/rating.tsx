import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Rating({
  value,
  count,
  size = 16,
  showCount = true,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  showCount?: boolean;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={
              i < rounded ? "fill-accent text-accent" : "text-border"
            }
          />
        ))}
      </div>
      {showCount && (
        <span className="text-xs text-muted-foreground">
          {count && count > 0
            ? `${value.toFixed(1)} (${count})`
            : "No reviews"}
        </span>
      )}
    </div>
  );
}
