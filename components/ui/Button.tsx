import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils";

type ButtonVariant = "primary" | "gradient" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover focus-visible:outline-brand",
  gradient:
    "text-white shadow-sm focus-visible:outline-brand",
  secondary:
    "border border-[var(--glass-border)] bg-[var(--glass)] text-ink hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-strong)] focus-visible:outline-brand",
  ghost:
    "text-ink-muted hover:bg-space-700/50 hover:text-ink focus-visible:outline-brand",
  danger:
    "bg-danger text-white hover:bg-danger/90 focus-visible:outline-danger",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  className,
  disabled,
  children,
  type = "button",
  style,
  ...props
}: ButtonProps) {
  const isGradient = variant === "gradient";

  return (
    <button
      type={type}
      className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
      style={
        isGradient
          ? { ...style, background: "var(--grad-brand)" }
          : style
      }
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {isLoading ? (loadingText ?? children) : children}
    </button>
  );
}
