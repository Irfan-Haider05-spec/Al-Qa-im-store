import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-deep shadow-card",
  secondary:
    "bg-secondary text-secondary-foreground hover:opacity-90",
  accent: "bg-accent text-accent-foreground hover:opacity-90",
  outline:
    "border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground",
  ghost: "bg-transparent text-foreground hover:bg-muted",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base py-3.5",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-colors",
          "focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
