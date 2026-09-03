"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Select } from "@/components/ui/Select";
import { bestTopic, worstTopic, scoreDistribution } from "@/utils/quizStats";
import type { QuizRecord } from "@/utils/quizStats";

interface TopicOption {
  id: string;
  name: string;
  subjectName: string;
  masteryLevel: number;
}

interface QuizDashboardProps {
  quizzes: QuizRecord[];
  topics: TopicOption[];
}

export function QuizDashboard({ quizzes, topics }: QuizDashboardProps) {
  const [sortField, setSortField] = useState<"date" | "score">("date");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");

  const total = quizzes.length;
  const avgScore = total > 0 ? Math.round(quizzes.reduce((s, q) => s + q.score, 0) / total) : 0;
  const best = bestTopic(quizzes);
  const worst = worstTopic(quizzes);
  const dist = scoreDistribution(quizzes);
  const maxBucket = Math.max(1, ...dist.map((b) => b.count));

  const sorted = [...quizzes].sort((a, b) => {
    if (sortField === "score") return b.score - a.score;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const topicOptions = topics.map((t) => ({ value: t.id, label: `${t.subjectName} — ${t.name}` }));

  return (
    <div className="space-y-8">
      {/* Stats bar */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="glass">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Total Quizzes</p>
          <p className="mt-1 text-2xl font-bold text-ink-strong">{total}</p>
        </Card>
        <Card variant="glass">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Average Score</p>
          <p className="mt-1 text-2xl font-bold text-ink-strong">{avgScore}%</p>
        </Card>
        <Card variant="glass">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Best Topic</p>
          <p className="mt-1 text-lg font-bold text-success">{best ?? "—"}</p>
        </Card>
        <Card variant="glass">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Needs Work</p>
          <p className="mt-1 text-lg font-bold text-warning">{worst ?? "—"}</p>
        </Card>
      </section>

      {/* Score distribution */}
      {total > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink-strong">Score Distribution</h2>
          <div className="grid grid-cols-4 gap-3">
            {dist.map((bucket) => (
              <div key={bucket.label} className="text-center">
                <div className="mx-auto mb-1 flex h-24 items-end">
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: `${(bucket.count / maxBucket) * 100}%`,
                      background: "var(--grad-bar)",
                      minHeight: bucket.count > 0 ? "4px" : "0px",
                    }}
                  />
                </div>
                <p className="text-xs text-ink-muted">{bucket.label}</p>
                <p className="text-sm font-bold text-ink-strong">{bucket.count}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick quiz launcher */}
      <section>
        <Card variant="solid">
          <h2 className="mb-4 text-lg font-semibold text-ink-strong">Quick Quiz</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Select
              label="Topic"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              options={topicOptions}
              placeholder="Select a topic..."
              className="flex-1"
            />
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              options={[
                { value: "easy", label: "Easy" },
                { value: "medium", label: "Medium" },
                { value: "hard", label: "Hard" },
              ]}
              className="sm:w-32"
            />
            <Link href={selectedTopic ? `/dashboard/mentor?topic=${selectedTopic}&mode=quiz` : "#"}>
              <Button variant="gradient" disabled={!selectedTopic}>
                Start Quiz
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Quiz history */}
      {total > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-strong">Quiz History</h2>
            <div className="flex gap-2">
              <Button
                variant={sortField === "date" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setSortField("date")}
              >
                By Date
              </Button>
              <Button
                variant={sortField === "score" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setSortField("score")}
              >
                By Score
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {sorted.map((q, i) => (
              <Card key={i} variant="glass" className="flex items-center justify-between !p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-strong">{q.topicName}</p>
                  <p className="text-xs text-ink-faint">
                    {q.subjectName} &middot; {new Date(q.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-muted">
                    {q.correctCount}/{q.totalQuestions}
                  </span>
                  <Badge tone={q.score >= 75 ? "success" : q.score >= 50 ? "warning" : "danger"}>
                    {q.score}%
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Topic grid */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink-strong">Topics</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Card key={topic.id} variant="glass" className="!p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-ink-strong">{topic.name}</p>
                <Badge tone="neutral">{topic.subjectName}</Badge>
              </div>
              <ProgressBar value={topic.masteryLevel} label="Mastery" />
              <Link
                href={`/dashboard/mentor?topic=${topic.id}&mode=quiz`}
                className="mt-3 block"
              >
                <Button variant="secondary" size="sm" className="w-full">
                  Take Quiz
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
