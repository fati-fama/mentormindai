import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Subjects" };

export default async function SubjectsPage() {
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
        <h1 className="text-2xl font-bold text-ink-strong">Subjects</h1>
        <p className="mt-1 text-sm text-ink-muted">All subjects and topics available for study.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <Card key={subject.id} variant="glass">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-strong">{subject.name}</h2>
              <Badge tone="brand">{subject.topics.length} topics</Badge>
            </div>
            <ul className="space-y-2">
              {subject.topics.map((topic) => {
                const masteryLevel = topic.progress[0]?.masteryLevel ?? 0;
                return (
                  <li
                    key={topic.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-ink-muted">{topic.name}</span>
                    <Badge
                      tone={
                        masteryLevel >= 70
                          ? "success"
                          : masteryLevel >= 40
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {Math.round(masteryLevel)}%
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
