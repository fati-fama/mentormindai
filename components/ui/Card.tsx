import { cn } from "@/utils";
import type { HTMLAttributes } from "react";

type CardVariant = "glass" | "solid" | "gradient";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  glow?: boolean;
  interactive?: boolean;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  glass: "bg-[var(--glass)] border border-[var(--glass-border)] backdrop-blur-[var(--glass-blur)]",
  solid: "bg-space-800 border border-space-600/50",
  gradient: "bg-gradient-to-br from-space-800 to-space-850 border border-space-600/50",
};

export function Card({
  variant = "glass",
  glow = false,
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5",
        VARIANT_CLASSES[variant],
        glow && "shadow-[var(--glow-brand)]",
        interactive &&
          "transition-all duration-200 hover:border-[var(--glass-border-hover)] hover:shadow-[var(--shadow-card)] cursor-pointer",
        className,
      )}
      style={{ boxShadow: !glow ? "var(--shadow-card)" : undefined }}
      {...props}
    >
      {children}
    </div>
  );
}
