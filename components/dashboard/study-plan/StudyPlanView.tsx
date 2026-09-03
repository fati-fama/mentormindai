"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StudyPlanIcon } from "@/components/ui/icons";
import type { StudyPlan } from "@/services/studyPlanService";

const PRIORITY_TONE: Record<string, "danger" | "warning" | "success"> = {
  high: "danger",
  medium: "warning",
  low: "success",
};

export function StudyPlanView() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study-plan", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate study plan");
      const data = (await res.json()) as { plan: StudyPlan };
      setPlan(data.plan);
    } catch {
      setError("Could not generate your study plan. Try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  if (!plan && !loading && !error) {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        <StudyPlanIcon size={48} className="text-brand" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-ink-strong">Generate Your Study Plan</h2>
          <p className="mt-2 max-w-md text-sm text-ink-muted">
            AI will analyze your progress, exam date, and weak areas to create a personalized
            7-day study schedule.
          </p>
        </div>
        <Button variant="gradient" size="lg" onClick={fetchPlan}>
          Generate Plan
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <ProgressBar value={100} label="Generating your study plan..." showValue={false} />
        <p className="text-sm text-ink-muted">Analyzing your progress and exam timeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-danger">{error}</p>
        <Button variant="secondary" onClick={fetchPlan}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink-strong">Your Weekly Study Plan</h2>
          <p className="mt-1 text-sm text-ink-muted">{plan.summary}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="brand">{plan.daysUntilExam} days to exam</Badge>
          <Button variant="secondary" size="sm" onClick={fetchPlan} isLoading={loading}>
            Regenerate
          </Button>
        </div>
      </div>

      {/* Day cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plan.weeklyPlan.map((day) => (
          <Card key={day.day} variant="glass">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-strong">{day.day}</h3>
              <Badge tone={PRIORITY_TONE[day.priority] ?? "neutral"}>{day.priority}</Badge>
            </div>
            <p className="mb-3 text-xs font-medium text-brand">{day.focus}</p>
            <ul className="space-y-1.5">
              {day.tasks.map((task, i) => (
                <li key={i} className="flex gap-2 text-xs text-ink-muted">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/60" />
                  {task}
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-[var(--glass-border)] pt-2">
              <span className="text-xs text-ink-faint">{day.duration} min</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      {plan.recommendations.length > 0 && (
        <Card variant="solid">
          <h3 className="mb-3 text-sm font-semibold text-ink-strong">AI Recommendations</h3>
          <ul className="space-y-2">
            {plan.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-muted">
                <span className="text-brand">*</span>
                {rec}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
