import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard";
import { daysUntil, formatMinutes, formatDate } from "@/utils";
import type { TopicProgressSummary } from "@/types";

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
      avatarMoodState: { select: { moodScore: true } },
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <DashboardHeader userName={profile?.name ?? null} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Mentor mood</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {profile?.avatarMoodState?.moodScore ?? 70}
              <span className="text-sm font-normal text-slate-500"> / 100</span>
            </p>
            <p className="text-sm text-slate-500">Based on your recent activity</p>
          </div>
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
                    <span className="text-xs font-medium text-indigo-600">
                      {masteryLabel(topic.masteryLevel)}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(topic.masteryLevel)} aria-valuemin={0} aria-valuemax={100} aria-label={`${topic.topicName} mastery`}>
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
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

        <section className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-base font-semibold text-slate-900">Your AI mentor chat</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            The personalized mentor chat — with Explain, Teach, Hint, Quiz, and Mistake Analysis modes —
            arrives in the next phase.
          </p>
        </section>
      </main>
    </div>
  );
}
