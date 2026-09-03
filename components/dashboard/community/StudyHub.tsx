"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CommunityIcon } from "@/components/ui/icons";
import type { ActivityEvent } from "@/utils/activityFeed";

const EVENT_TONES: Record<string, "brand" | "success" | "warning" | "danger"> = {
  quiz: "brand",
  milestone: "success",
  mistake: "warning",
};

interface StudyHubProps {
  events: ActivityEvent[];
  totalQuizzes: number;
  quizzesThisWeek: number;
}

export function StudyHub({ events, totalQuizzes, quizzesThisWeek }: StudyHubProps) {
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);

  const fetchTip = useCallback(async () => {
    setLoadingTip(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: "",
          query: "Give me 3 concise study tips based on general best practices for exam preparation",
          mode: "explain",
          history: [],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { content: string };
        setAiTip(data.content);
      }
    } catch {
      setAiTip("Could not load tips right now. Try again later.");
    } finally {
      setLoadingTip(false);
    }
  }, []);

  const weeklyGoal = 5;
  const challengeProgress = Math.min(100, (quizzesThisWeek / weeklyGoal) * 100);

  return (
    <div className="space-y-8">
      {/* Activity feed + AI tips */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity feed */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-ink-strong">Activity Feed</h2>
          {events.length === 0 ? (
            <Card variant="glass" className="py-8 text-center">
              <CommunityIcon size={32} className="mx-auto mb-2 text-ink-faint" />
              <p className="text-sm text-ink-muted">
                No activity yet. Take quizzes and track progress to build your feed.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 20).map((event, i) => (
                <Card key={i} variant="glass" className="flex items-start gap-3 !p-3">
                  <Badge tone={EVENT_TONES[event.type] ?? "neutral"} className="mt-0.5 shrink-0">
                    {event.type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-strong">{event.title}</p>
                    <p className="text-xs text-ink-muted">{event.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* AI Tips sidebar */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-ink-strong">AI Study Tips</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchTip}
            isLoading={loadingTip}
            className="mb-3 w-full"
          >
            Ask AI for Tips
          </Button>
          {aiTip && (
            <Card variant="solid">
              <p className="whitespace-pre-line text-sm text-ink">{aiTip}</p>
            </Card>
          )}

          <Card variant="glass" className="mt-4">
            <h3 className="mb-2 text-sm font-semibold text-ink-strong">Your Stats</h3>
            <div className="space-y-1 text-xs text-ink-muted">
              <p>Total quizzes taken: <span className="font-semibold text-ink-strong">{totalQuizzes}</span></p>
              <p>This week: <span className="font-semibold text-ink-strong">{quizzesThisWeek}</span></p>
            </div>
          </Card>
        </div>
      </div>

      {/* Study challenge */}
      <section>
        <Card variant="solid">
          <h2 className="mb-3 text-lg font-semibold text-ink-strong">Weekly Challenge</h2>
          <p className="mb-3 text-sm text-ink-muted">
            Complete {weeklyGoal} quizzes this week to stay on track.
          </p>
          <ProgressBar
            value={challengeProgress}
            label={`${quizzesThisWeek} / ${weeklyGoal} quizzes`}
          />
          {challengeProgress >= 100 && (
            <Badge tone="success" className="mt-3">Challenge Complete!</Badge>
          )}
        </Card>
      </section>
    </div>
  );
}
