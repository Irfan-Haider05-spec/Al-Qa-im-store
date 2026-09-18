import { cn } from "@/lib/utils/cn";

type Tone = "primary" | "accent" | "success" | "warning" | "danger" | "muted";

// Every tone clears 4.5:1 for its text. Gold is used as a fill with ink text,
// never as text on ivory, where it measures only 2.3:1.
const tones: Record<Tone, string> = {
  primary: "bg-ink text-ivory",
  accent: "bg-gold text-ink",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
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
        "inline-flex items-center rounded-pill px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
