import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AvatarMoodIndicator } from "@/components/avatar/AvatarMoodIndicator";
import { formatMinutes } from "@/utils";
import { ProgressRing, FlameIcon, ClockIcon, TrophyIcon } from "@/components/ui";
import {
  overallProgress,
  studyStreak,
  avgQuizScore,
  weeklyBuckets,
  weakestTopic,
  aiSuggestion,
} from "@/utils/metrics";
import { QuickStatCard } from "@/components/dashboard/widgets/QuickStatCard";
import { TodaysGoalCard } from "@/components/dashboard/widgets/TodaysGoalCard";
import { WeakestTopicCard } from "@/components/dashboard/widgets/WeakestTopicCard";
import { UpcomingExamCard } from "@/components/dashboard/widgets/UpcomingExamCard";
import { AiSuggestsCard } from "@/components/dashboard/widgets/AiSuggestsCard";
import { WeeklyProgressChart } from "@/components/dashboard/widgets/WeeklyProgressChart";
import { TopicProgressList } from "@/components/dashboard/widgets/TopicProgressList";
import { MiniGamesCard } from "@/components/dashboard/widgets/MiniGamesCard";
import { QuoteWidget } from "@/components/dashboard/widgets/QuoteWidget";
import type { WhiteRobotMood } from "@/components/robot/WhiteRobot";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      targetExam: true,
      examDate: true,
      targetScore: true,
      dailyStudyMinutes: true,
      avatarMoodState: { select: { currentMood: true, moodScore: true, moodReason: true } },
      topicProgress: {
        orderBy: [{ masteryLevel: "asc" }],
        take: 8,
        select: {
          masteryLevel: true,
          accuracy: true,
          attemptCount: true,
          topic: {
            select: { id: true, name: true, subject: { select: { name: true } } },
          },
        },
      },
      quizAttempts: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { correctCount: true, totalQuestions: true, createdAt: true },
      },
      _count: { select: { mistakes: true } },
    },
  });

  const topicProgress = (profile?.topicProgress ?? []).map((row) => ({
    topicId: row.topic.id,
    topicName: row.topic.name,
    subjectName: row.topic.subject.name,
    masteryLevel: row.masteryLevel,
    accuracy: row.accuracy,
    attemptCount: row.attemptCount,
  }));

  const subjectNames = [...new Set(topicProgress.map((t) => t.subjectName))];

  const quizAttempts = profile?.quizAttempts ?? [];
  const mistakeCount = profile?._count.mistakes ?? 0;

  const overall = overallProgress(profile?.topicProgress ?? []);
  const streak = studyStreak(quizAttempts);
  const avgScore = avgQuizScore(quizAttempts);
  const weekBuckets = weeklyBuckets(quizAttempts);
  const weakest = weakestTopic(profile?.topicProgress ?? []);
  const suggestion = aiSuggestion(weakest, mistakeCount);

  const mood: WhiteRobotMood = (profile?.avatarMoodState?.currentMood as WhiteRobotMood) ?? "NEUTRAL";
  const moodScore = profile?.avatarMoodState?.moodScore ?? 70;
  const moodReason =
    profile?.avatarMoodState?.moodReason ?? "Your mentor is ready to help you learn.";

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-ink-strong">
          Welcome back, {profile?.name ?? "student"}.
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Here&apos;s your learning snapshot.
        </p>
      </div>

      {/* Quote widget */}
      <section>
        <QuoteWidget
          userName={profile?.name ?? null}
          subjectNames={subjectNames}
          overallProgress={overall}
        />
      </section>

      {/* Quick stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStatCard
          icon={<span />}
          iconSlot={<ProgressRing value={overall} size={48} strokeWidth={4} />}
          label="Overall Progress"
          value={`${overall}%`}
        />
        <QuickStatCard
          icon={<FlameIcon size={22} />}
          label="Study Streak"
          value={`${streak} day${streak === 1 ? "" : "s"}`}
        />
        <QuickStatCard
          icon={<ClockIcon size={22} />}
          label="Daily Study"
          value={profile?.dailyStudyMinutes ? formatMinutes(profile.dailyStudyMinutes) : "—"}
        />
        <QuickStatCard
          icon={<TrophyIcon size={22} />}
          label="Avg Quiz Score"
          value={`${avgScore}%`}
        />
      </section>

      {/* Insight grid */}
      <section className="grid gap-4 sm:grid-cols-2">
        <TodaysGoalCard
          weakestTopicName={weakest?.name ?? null}
          dailyStudyMinutes={profile?.dailyStudyMinutes ?? null}
        />
        <WeakestTopicCard
          topicName={weakest?.name ?? null}
          mastery={weakest?.mastery ?? 0}
        />
        <UpcomingExamCard
          examName={profile?.targetExam ?? null}
          examDate={profile?.examDate ?? null}
        />
        <AiSuggestsCard suggestion={suggestion} />
      </section>

      {/* Weekly chart */}
      <section>
        <WeeklyProgressChart buckets={weekBuckets} />
      </section>

      {/* Mood + Topic progress */}
      <section className="space-y-6">
        <AvatarMoodIndicator mood={mood} score={moodScore} reason={moodReason} />
        <TopicProgressList topics={topicProgress} />
      </section>

      {/* Mini games */}
      <section>
        <MiniGamesCard />
      </section>
    </div>
  );
}
