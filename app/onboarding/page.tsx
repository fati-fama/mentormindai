import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import type { SubjectOption } from "@/types";

export const metadata = {
  title: "Set up your mentor",
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.onboardingCompleted) {
    redirect("/dashboard");
  }

  let subjects: SubjectOption[] = [];
  let subjectsError = false;
  try {
    const rows = await prisma.subject.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, topics: { select: { id: true } } },
    });
    subjects = rows.map((row) => ({
      id: row.id,
      name: row.name,
      topicCount: row.topics.length,
    }));
  } catch (error) {
    console.error("Failed to load subjects for onboarding:", error);
    subjectsError = true;
  }

  return (
    <div className="min-h-screen bg-space-950">
      <header className="border-b border-glass-border bg-space-900/80 backdrop-blur-[var(--glass-blur)]">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
          <span className="text-base font-semibold tracking-tight text-ink-strong">
            MentorMind <span className="text-brand">AI</span>
          </span>
          <p className="text-xs text-ink-faint">Welcome, {user.email}</p>
        </div>
      </header>
      {subjectsError ? (
        <div className="mx-auto mt-12 w-full max-w-2xl px-6">
          <div className="rounded-2xl border border-danger/30 bg-danger/10 p-8 text-sm text-danger">
            Could not reach the database. Make sure DATABASE_URL is configured and the database is
            running, then refresh this page.
          </div>
        </div>
      ) : (
        <OnboardingWizard subjects={subjects} />
      )}
    </div>
  );
}
