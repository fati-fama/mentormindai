import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AvatarMoodIndicator } from "@/components/avatar/AvatarMoodIndicator";
import { daysUntil, formatMinutes, formatDate } from "@/utils";
import type { TopicProgressSummary } from "@/types";
import type { RobotMood } from "@/components/avatar/Robot";

export const metadata = {
  title: "Dashboard",
};

function masteryLabel(mastery: number): string {
  if (mastery < 20) return "Beginner";
  if (mastery < 40) return "Developing";
  if (mastery < 60) return "Progressing";
  if (mastery < 80) return "Strong";
  if (mastery < 91) return "Advanced";
  return "Mastery";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.onboardingCompleted) {
    redirect("/onboarding");
  }

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
    },
  });

  const progress: TopicProgressSummary[] = (profile?.topicProgress ?? []).map((row) => ({
    topicId: row.topic.id,
    topicName: row.topic.name,
    subjectName: row.topic.subject.name,
    masteryLevel: row.masteryLevel,
    accuracy: row.accuracy,
    attemptCount: row.attemptCount,
  }));

  const examCountdown = profile?.examDate ? daysUntil(profile.examDate) : null;
  const mood: RobotMood = (profile?.avatarMoodState?.currentMood as RobotMood) ?? "NEUTRAL";
  const moodScore = profile?.avatarMoodState?.moodScore ?? 70;
  const moodReason =
    profile?.avatarMoodState?.moodReason ?? "Your mentor is ready to help you learn.";

  return (
    <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {profile?.name ?? "student"}.
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Here&apos;s where your mentor stands on your preparation.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Target exam</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{profile?.targetExam ?? "—"}</p>
            <p className="text-sm text-slate-500">Goal: {profile?.targetScore ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Exam countdown</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {examCountdown !== null ? `${examCountdown} day${examCountdown === 1 ? "" : "s"}` : "—"}
            </p>
            <p className="text-sm text-slate-500">
              {profile?.examDate ? formatDate(profile.examDate) : "No exam date set"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Daily study time</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {profile?.dailyStudyMinutes ? formatMinutes(profile.dailyStudyMinutes) : "—"}
            </p>
            <p className="text-sm text-slate-500">Committed per day</p>
          </div>
          <AvatarMoodIndicator mood={mood} score={moodScore} reason={moodReason} />
        </section>

        <section className="mt-10">
          <h2 className="text-base font-semibold text-slate-900">Topic progress</h2>
          <p className="mt-1 text-sm text-slate-600">
            Sorted by mastery — your weakest topics first, so your mentor knows where to focus.
          </p>

          {progress.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              No topic progress yet. It will appear here as you practice and take quizzes.
            </div>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {progress.map((topic) => (
                <li key={`${topic.subjectName}-${topic.topicName}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{topic.topicName}</p>
                      <p className="text-xs text-slate-500">{topic.subjectName}</p>
                    </div>
                    <span className="text-xs font-medium text-[var(--brand)]">
                      {masteryLabel(topic.masteryLevel)}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(topic.masteryLevel)} aria-valuemin={0} aria-valuemax={100} aria-label={`${topic.topicName} mastery`}>
                    <div
                      className="h-full rounded-full bg-[var(--brand)] transition-all"
                      style={{ width: `${Math.max(2, topic.masteryLevel)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Mastery {Math.round(topic.masteryLevel)}%
                    {topic.accuracy !== null && ` · Accuracy ${Math.round(topic.accuracy)}%`} ·{" "}
                    {topic.attemptCount} attempt{topic.attemptCount === 1 ? "" : "s"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <Link
            href="/dashboard/mentor"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[var(--brand)] hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand)]">AI mentor</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">Talk to your mentor</h2>
            <p className="mt-2 text-sm text-slate-600">
              Explain, Teach, Hint, Quiz, or Mistake Analysis — your mentor answers in your voice,
              calibrated to your current level.
            </p>
            <p className="mt-4 text-sm font-medium text-[var(--brand)] group-hover:underline">
              Open the chat →
            </p>
          </Link>
          <Link
            href="/dashboard/books"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[var(--accent)] hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">Book library</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">Your course books</h2>
            <p className="mt-2 text-sm text-slate-600">
              Add the books you&apos;re actually studying from. Your mentor will mirror their
              terminology and approach.
            </p>
            <p className="mt-4 text-sm font-medium text-[var(--accent)] group-hover:underline">
              Manage books →
            </p>
          </Link>
        </section>
    </div>
  );
}
