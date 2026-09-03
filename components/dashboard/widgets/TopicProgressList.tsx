import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";

interface TopicProgress {
  topicId: string;
  topicName: string;
  subjectName: string;
  masteryLevel: number;
  accuracy: number | null;
  attemptCount: number;
}

interface TopicProgressListProps {
  topics: TopicProgress[];
}

function masteryLabel(mastery: number): string {
  if (mastery < 20) return "Beginner";
  if (mastery < 40) return "Developing";
  if (mastery < 60) return "Progressing";
  if (mastery < 80) return "Strong";
  if (mastery < 91) return "Advanced";
  return "Mastery";
}

export function TopicProgressList({ topics }: TopicProgressListProps) {
  if (topics.length === 0) {
    return (
      <Card variant="glass" className="text-center">
        <p className="text-sm text-ink-muted">
          No topic progress yet. It will appear here as you practice and take quizzes.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-ink-strong">Topic Progress</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((topic) => (
          <Card key={topic.topicId} variant="glass" className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-strong">{topic.topicName}</p>
                <p className="text-xs text-ink-faint">{topic.subjectName}</p>
              </div>
              <Badge
                tone={
                  topic.masteryLevel >= 60
                    ? "success"
                    : topic.masteryLevel >= 30
                      ? "warning"
                      : "neutral"
                }
              >
                {masteryLabel(topic.masteryLevel)}
              </Badge>
            </div>
            <ProgressBar value={topic.masteryLevel} showValue={false} className="mt-3" />
            <p className="mt-2 text-xs text-ink-faint">
              {Math.round(topic.masteryLevel)}% mastery
              {topic.accuracy !== null && ` · ${Math.round(topic.accuracy)}% accuracy`} ·{" "}
              {topic.attemptCount} attempt{topic.attemptCount === 1 ? "" : "s"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
