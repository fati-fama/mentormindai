"use client";

import { Robot, type RobotMood } from "./Robot";
import { cn } from "@/utils";

type Props = {
  mood: RobotMood;
  score: number;
  reason?: string;
  className?: string;
};

const MOOD_LABEL: Record<RobotMood, string> = {
  HAPPY: "Motivated",
  NEUTRAL: "Steady",
  SAD: "Needs a boost",
};

const MOOD_TINT: Record<RobotMood, string> = {
  HAPPY: "bg-emerald-50 border-emerald-200",
  NEUTRAL: "bg-slate-50 border-slate-200",
  SAD: "bg-amber-50 border-amber-200",
};

export function AvatarMoodIndicator({ mood, score, reason, className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-4 shadow-sm",
        MOOD_TINT[mood],
        className,
      )}
      title={reason}
    >
      <div className="h-16 w-16 shrink-0">
        <Robot mood={mood} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Mentor mood</p>
        <p className="mt-0.5 text-base font-semibold text-slate-900">
          {MOOD_LABEL[mood]}{" "}
          <span className="text-sm font-normal text-slate-500">· {Math.round(score)}/100</span>
        </p>
        {reason && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-600" title={reason}>
            {reason}
          </p>
        )}
      </div>
    </div>
  );
}
