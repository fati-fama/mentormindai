import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { MistakeType } from "@/lib/generated/prisma/client";

const MISTAKE_TYPE_LABELS: Record<MistakeType, string> = {
  CONCEPTUAL: "Conceptual",
  CALCULATION: "Calculation",
  FORMULA_RECALL: "Formula recall",
  MISREAD_QUESTION: "Misread question",
  PROCEDURAL: "Procedural",
  CARELESS: "Careless",
  GUESSING: "Guessing",
  OTHER: "Other",
};

export const metadata = { title: "Mistake Bank" };

export default async function MistakesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const mistakes = await prisma.mistake.findMany({
    where: { userId: user.id },
    include: {
      topic: { include: { subject: true } },
    },
    orderBy: [{ repetitionCount: "desc" }, { lastOccurredAt: "desc" }],
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-strong">Mistake Bank</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Review your past mistakes to strengthen weak areas.
        </p>
      </div>

      {mistakes.length === 0 ? (
        <Card variant="glass">
          <EmptyState
            title="No mistakes yet"
            body="Take a quiz with your AI Mentor to start building your mistake bank."
            cta={
              <Link href="/dashboard/mentor">
                <Button variant="gradient">Start Learning</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {mistakes.map((mistake) => (
            <Card key={mistake.id} variant="glass" className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {mistake.topic && (
                      <>
                        <Badge tone="brand">{mistake.topic.subject.name}</Badge>
                        <span className="text-xs text-ink-faint">{mistake.topic.name}</span>
                      </>
                    )}
                    <Badge tone="neutral">{MISTAKE_TYPE_LABELS[mistake.mistakeType]}</Badge>
                    {mistake.repetitionCount > 1 && (
                      <Badge tone="danger">Missed ×{mistake.repetitionCount}</Badge>
                    )}
                    {mistake.resolved && (
                      <span className="text-xs text-ink-faint">Resolved</span>
                    )}
                  </div>
                  {mistake.question && (
                    <p className="text-sm font-medium text-ink-strong whitespace-pre-wrap">
                      {mistake.question}
                    </p>
                  )}
                  <p className="text-sm text-ink-muted whitespace-pre-wrap">
                    Your answer: {mistake.studentAnswer}
                  </p>
                  {mistake.correctAnswer && (
                    <p className="text-sm text-success">
                      Correct: {mistake.correctAnswer}
                    </p>
                  )}
                  {mistake.explanation && (
                    <div className="mt-3 rounded-lg border border-glass-border bg-glass/50 p-3">
                      <p className="mb-1 text-xs font-medium text-ink-muted">AI analysis</p>
                      <p className="text-sm text-ink whitespace-pre-wrap">{mistake.explanation}</p>
                    </div>
                  )}
                </div>
                <Link href={`/dashboard/mentor?mode=mistake-analysis&topic=${mistake.topicId}`}>
                  <Button variant="secondary" size="sm">
                    Review
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
