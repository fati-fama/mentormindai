import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const subjects = await prisma.subject.findMany({
    include: {
      topics: {
        include: {
          progress: { where: { userId: user.id } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-strong">Progress</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Track your mastery across all subjects and topics.
        </p>
      </div>

      <div className="space-y-6">
        {subjects.map((subject) => {
          const topicMasteries = subject.topics.map((t) => t.progress[0]?.masteryLevel ?? 0);
          const avgScore =
            topicMasteries.length > 0
              ? Math.round(topicMasteries.reduce((a: number, b: number) => a + b, 0) / topicMasteries.length)
              : 0;

          return (
            <Card key={subject.id} variant="glass">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-strong">{subject.name}</h2>
                <Badge tone={avgScore >= 60 ? "success" : avgScore >= 30 ? "warning" : "neutral"}>
                  {avgScore}% avg
                </Badge>
              </div>
              <div className="space-y-3">
                {subject.topics.map((topic) => {
                  const score = topic.progress[0]?.masteryLevel ?? 0;
                  return (
                    <ProgressBar
                      key={topic.id}
                      value={score}
                      label={topic.name}
                    />
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
