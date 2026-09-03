import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GamesHub } from "@/components/dashboard/games/GamesHub";

export const metadata = { title: "Games" };

export default async function GamesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const topics = await prisma.topic.findMany({
    include: {
      subject: { select: { name: true } },
      progress: {
        where: { userId: user.id },
        select: { masteryLevel: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const topicData = topics.map((t) => ({
    id: t.id,
    name: t.name,
    subjectName: t.subject.name,
    masteryLevel: t.progress[0]?.masteryLevel ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-strong">Games</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Reinforce your knowledge with interactive mini-games.
        </p>
      </div>
      <GamesHub topics={topicData} />
    </div>
  );
}
