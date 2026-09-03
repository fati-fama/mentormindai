import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { QuizDashboard } from "@/components/dashboard/quizzes/QuizDashboard";
import type { QuizRecord } from "@/utils/quizStats";

export const metadata = { title: "Quizzes & Tests" };

export default async function QuizzesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const [quizAttempts, topics] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        topicId: true,
        correctCount: true,
        totalQuestions: true,
        createdAt: true,
        topic: { select: { name: true, subject: { select: { name: true } } } },
      },
    }),
    prisma.topic.findMany({
      include: {
        subject: { select: { name: true } },
        progress: {
          where: { userId: user.id },
          select: { masteryLevel: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const quizzes: QuizRecord[] = quizAttempts.map((q) => ({
    topicId: q.topicId,
    topicName: q.topic.name,
    subjectName: q.topic.subject.name,
    score: q.totalQuestions > 0 ? Math.round((q.correctCount / q.totalQuestions) * 100) : 0,
    correctCount: q.correctCount,
    totalQuestions: q.totalQuestions,
    createdAt: q.createdAt,
  }));

  const topicData = topics.map((t) => ({
    id: t.id,
    name: t.name,
    subjectName: t.subject.name,
    masteryLevel: t.progress[0]?.masteryLevel ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-strong">Quizzes & Tests</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Track your quiz performance and launch new assessments.
        </p>
      </div>
      <QuizDashboard quizzes={quizzes} topics={topicData} />
    </div>
  );
}
