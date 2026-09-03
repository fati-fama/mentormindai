import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ClockIcon } from "@/components/ui/icons";
import { daysUntil, formatDate } from "@/utils";

interface UpcomingExamCardProps {
  examName: string | null;
  examDate: Date | null;
}

export function UpcomingExamCard({ examName, examDate }: UpcomingExamCardProps) {
  const days = examDate ? daysUntil(examDate) : null;

  return (
    <Card variant="glass">
      <div className="mb-3 flex items-center gap-2">
        <ClockIcon size={18} className="text-accent" />
        <h3 className="text-sm font-semibold text-ink-strong">Upcoming Exam</h3>
      </div>
      {examName && examDate ? (
        <>
          <p className="text-base font-medium text-ink">{examName}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={days !== null && days <= 7 ? "danger" : "brand"}>
              {days !== null ? `${days} day${days === 1 ? "" : "s"} left` : "—"}
            </Badge>
            <span className="text-xs text-ink-faint">{formatDate(examDate)}</span>
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-muted">No exam date set. Update in onboarding.</p>
      )}
    </Card>
  );
}
