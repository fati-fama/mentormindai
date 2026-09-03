import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NAV_ITEMS } from "@/components/dashboard/navConfig";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.onboardingCompleted) {
    redirect("/onboarding");
  }

  const [profile, topics] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, educationLevel: true },
    }),
    prisma.topic.findMany({
      where: {
        progress: { some: { userId: user.id } },
      },
      select: { id: true, name: true, subject: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const searchIndex = [
    ...NAV_ITEMS.filter((item) => item.status === "ready").map((item) => ({
      type: "page" as const,
      label: item.label,
      href: item.href,
    })),
    ...topics.map((topic) => ({
      type: "topic" as const,
      label: topic.name,
      href: `/dashboard/mentor?topic=${topic.id}`,
      subtitle: topic.subject.name,
    })),
  ];

  return (
    <DashboardShell
      userName={profile?.name ?? null}
      educationLevel={profile?.educationLevel ?? null}
      searchIndex={searchIndex}
    >
      {children}
    </DashboardShell>
  );
}
