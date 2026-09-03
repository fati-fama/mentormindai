"use client";

import { WhiteRobot, type WhiteRobotMood } from "@/components/robot/WhiteRobot";
import { cn } from "@/utils";
import { Card } from "@/components/ui/Card";

type Props = {
  mood: WhiteRobotMood;
  score: number;
  reason?: string;
  className?: string;
};

const MOOD_LABEL: Record<WhiteRobotMood, string> = {
  HAPPY: "Motivated",
  NEUTRAL: "Steady",
  SAD: "Needs a boost",
};

const MOOD_GLOW: Record<WhiteRobotMood, string> = {
  HAPPY: "ring-1 ring-success/20",
  NEUTRAL: "ring-1 ring-ink-faint/20",
  SAD: "ring-1 ring-warning/20",
};

export function AvatarMoodIndicator({ mood, score, reason, className }: Props) {
  return (
    <Card className={cn("flex items-center gap-4", MOOD_GLOW[mood], className)}>
      <div className="h-16 w-16 shrink-0">
        <WhiteRobot mood={mood} className="h-16 w-16" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Mentor mood</p>
        <p className="mt-0.5 text-base font-semibold text-ink-strong">
          {MOOD_LABEL[mood]}{" "}
          <span className="text-sm font-normal text-ink-muted">&middot; {Math.round(score)}/100</span>
        </p>
        {reason && (
          <p className="mt-1 line-clamp-2 text-xs text-ink-muted" title={reason}>
            {reason}
          </p>
        )}
      </div>
    </Card>
  );
}
