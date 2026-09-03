import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { TargetIcon } from "@/components/ui/icons";

interface TodaysGoalCardProps {
  weakestTopicName: string | null;
  dailyStudyMinutes: number | null;
}

export function TodaysGoalCard({ weakestTopicName, dailyStudyMinutes }: TodaysGoalCardProps) {
  return (
    <Card variant="glass">
      <div className="mb-3 flex items-center gap-2">
        <TargetIcon size={18} className="text-brand" />
        <h3 className="text-sm font-semibold text-ink-strong">Today&apos;s Goal</h3>
      </div>
      {weakestTopicName ? (
        <p className="text-sm text-ink-muted">
          Focus on <span className="font-medium text-ink">{weakestTopicName}</span>
          {dailyStudyMinutes && (
            <> — aim for <span className="font-medium text-ink">{dailyStudyMinutes} min</span> of study.</>
          )}
        </p>
      ) : (
        <p className="text-sm text-ink-muted">Start a session with your mentor to set goals.</p>
      )}
      <div className="mt-4">
        <Link href="/dashboard/mentor">
          <Button variant="gradient" size="sm">Start Now</Button>
        </Link>
      </div>
    </Card>
  );
}
