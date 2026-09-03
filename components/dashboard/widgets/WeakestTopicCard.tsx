import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface WeakestTopicCardProps {
  topicName: string | null;
  mastery: number;
}

export function WeakestTopicCard({ topicName, mastery }: WeakestTopicCardProps) {
  return (
    <Card variant="glass">
      <h3 className="mb-3 text-sm font-semibold text-ink-strong">Weakest Topic</h3>
      {topicName ? (
        <>
          <p className="text-base font-medium text-ink">{topicName}</p>
          <ProgressBar value={mastery} label="Mastery" className="mt-3" />
        </>
      ) : (
        <p className="text-sm text-ink-muted">No data yet — take a quiz to see your weakest area.</p>
      )}
    </Card>
  );
}
