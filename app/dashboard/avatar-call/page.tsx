import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AvatarCall } from "@/components/avatar/AvatarCall";

export const metadata = { title: "Avatar Call" };

export default async function AvatarCallPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    select: {
      name: true,
      topics: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });

  const topics = subjects.flatMap((s) =>
    s.topics.map((t) => ({ id: t.id, name: t.name, subjectName: s.name })),
  );

  return <AvatarCall topics={topics} />;
}
