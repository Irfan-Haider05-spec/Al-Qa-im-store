import { cn } from "@/lib/utils/cn";

type Tone = "primary" | "accent" | "success" | "warning" | "danger" | "muted";

const tones: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary-deep",
  accent: "bg-accent/15 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-3 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
