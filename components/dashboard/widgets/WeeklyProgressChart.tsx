import { Card } from "@/components/ui/Card";

interface WeeklyProgressChartProps {
  buckets: { label: string; count: number }[];
}

export function WeeklyProgressChart({ buckets }: WeeklyProgressChartProps) {
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <Card variant="glass" className="col-span-full">
      <h3 className="mb-4 text-sm font-semibold text-ink-strong">Weekly Progress</h3>
      <div className="flex items-end gap-2 h-32">
        {buckets.map((bucket) => {
          const heightPct = max > 0 ? (bucket.count / max) * 100 : 0;
          return (
            <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="relative w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    background: "var(--grad-bar)",
                    minHeight: "4px",
                  }}
                />
              </div>
              <span className="text-[10px] text-ink-faint">{bucket.label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
