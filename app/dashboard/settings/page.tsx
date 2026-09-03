import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { SettingsPreferences } from "@/components/dashboard/SettingsPreferences";
import { AiSettingsCard } from "@/components/dashboard/AiSettingsCard";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      educationLevel: true,
      targetExam: true,
      examDate: true,
      targetScore: true,
      dailyStudyMinutes: true,
      createdAt: true,
    },
  });

  if (!profile) return null;

  const fields = [
    { label: "Name", value: profile.name ?? "—" },
    { label: "Email", value: profile.email },
    { label: "Education Level", value: profile.educationLevel ?? "—" },
    { label: "Target Exam", value: profile.targetExam ?? "—" },
    {
      label: "Exam Date",
      value: profile.examDate
        ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(profile.examDate)
        : "—",
    },
    { label: "Target Score", value: profile.targetScore ?? "—" },
    { label: "Daily Study Minutes", value: String(profile.dailyStudyMinutes ?? 30) },
    {
      label: "Member Since",
      value: new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(profile.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-strong">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Your profile information. Edit via onboarding to update.</p>
      </div>

      <Card variant="glass" className="max-w-xl">
        <dl className="divide-y divide-space-600/30">
          {fields.map((field) => (
            <div key={field.label} className="flex items-center justify-between py-3">
              <dt className="text-sm text-ink-muted">{field.label}</dt>
              <dd className="text-sm font-medium text-ink-strong">{field.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card variant="glass" className="max-w-xl">
        <h2 className="mb-3 text-sm font-semibold text-ink-strong">Theme</h2>
        <p className="text-sm text-ink-muted">
          Customize colors and layout in the{" "}
          <a href="/dashboard/theme" className="text-brand hover:underline">
            Theme Creator
          </a>
          .
        </p>
      </Card>

      <SettingsPreferences />

      <AiSettingsCard />
    </div>
  );
}
