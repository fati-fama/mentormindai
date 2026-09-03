import { Card } from "@/components/ui/Card";
import { cn } from "@/utils";

interface QuickStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
  iconSlot?: React.ReactNode;
}

export function QuickStatCard({ icon, label, value, sub, className, iconSlot }: QuickStatCardProps) {
  return (
    <Card variant="glass" className={cn("flex items-center gap-4", className)}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
        {iconSlot ?? icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
        <p className="text-lg font-bold text-ink-strong">{value}</p>
        {sub && <p className="text-xs text-ink-muted">{sub}</p>}
      </div>
    </Card>
  );
}
