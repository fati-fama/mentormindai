import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ThemeCreator } from "@/components/theme/ThemeCreator";

export const metadata = { title: "Theme" };

export default async function ThemePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  return <ThemeCreator />;
}
