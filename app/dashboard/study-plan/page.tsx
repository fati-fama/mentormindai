import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { StudyPlanView } from "@/components/dashboard/study-plan/StudyPlanView";

export const metadata = { title: "Study Plan" };

export default async function StudyPlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-strong">Study Plan</h1>
        <p className="mt-1 text-sm text-ink-muted">
          AI-powered weekly schedule tailored to your exam goals.
        </p>
      </div>
      <StudyPlanView />
    </div>
  );
}
