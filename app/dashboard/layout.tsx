import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.onboardingCompleted) {
    redirect("/onboarding");
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  });

  return <DashboardShell userName={profile?.name ?? null}>{children}</DashboardShell>;
}
