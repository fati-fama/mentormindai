import { Card } from "@/components/ui/Card";
import { RobotIcon } from "@/components/ui/icons";

interface AiSuggestsCardProps {
  suggestion: string;
}

export function AiSuggestsCard({ suggestion }: AiSuggestsCardProps) {
  return (
    <Card variant="glass">
      <div className="mb-3 flex items-center gap-2">
        <RobotIcon size={18} className="text-brand" />
        <h3 className="text-sm font-semibold text-ink-strong">AI Suggests</h3>
      </div>
      <p className="text-sm leading-relaxed text-ink-muted">{suggestion}</p>
    </Card>
  );
}
