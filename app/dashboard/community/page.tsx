import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { StudyHub } from "@/components/dashboard/community/StudyHub";
import { buildActivityFeed } from "@/utils/activityFeed";

export const metadata = { title: "Community" };

export default async function CommunityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const [quizAttempts, topicProgress, mistakes] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        correctCount: true,
        totalQuestions: true,
        createdAt: true,
        topic: { select: { name: true } },
      },
    }),
    prisma.userTopicProgress.findMany({
      where: { userId: user.id },
      select: {
        masteryLevel: true,
        topic: { select: { name: true } },
      },
    }),
    prisma.mistake.findMany({
      where: { userId: user.id },
      orderBy: { lastOccurredAt: "desc" },
      take: 50,
      select: {
        question: true,
        lastOccurredAt: true,
        topic: { select: { name: true } },
      },
    }),
  ]);

  const quizData = quizAttempts.map((q) => ({
    topicName: q.topic.name,
    score: q.totalQuestions > 0 ? Math.round((q.correctCount / q.totalQuestions) * 100) : 0,
    correctCount: q.correctCount,
    totalQuestions: q.totalQuestions,
    createdAt: q.createdAt,
  }));

  const progressData = topicProgress.map((p) => ({
    topicName: p.topic.name,
    masteryLevel: p.masteryLevel,
  }));

  const mistakeData = mistakes.map((m) => ({
    question: m.question,
    topicName: m.topic?.name ?? "Unknown",
    lastOccurredAt: m.lastOccurredAt,
  }));

  const events = buildActivityFeed(quizData, progressData, mistakeData);

  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const quizzesThisWeek = quizAttempts.filter((q) => {
    const d = new Date(q.createdAt);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= dayOfWeek && diffDays >= 0;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-strong">Study Hub</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Your learning activity, AI-powered insights, and weekly challenges.
        </p>
      </div>
      <StudyHub
        events={events}
        totalQuizzes={quizAttempts.length}
        quizzesThisWeek={quizzesThisWeek}
      />
    </div>
  );
}
