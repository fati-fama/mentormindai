import { cn } from "@/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-ink-muted">{label}</span>}
          {showValue && <span className="text-ink-strong font-medium">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-space-700/60"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className="relative h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "var(--grad-bar)",
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.2) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "mentormind-shimmer 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}
