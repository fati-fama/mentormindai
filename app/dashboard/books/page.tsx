import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookLibrary } from "@/components/books/BookLibrary";

export const metadata = { title: "Book Library" };

export default async function BooksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const [books, subjects] = await Promise.all([
    prisma.book.findMany({
      where: { userId: user.id },
      orderBy: [{ subjectId: "asc" }, { createdAt: "desc" }],
      include: { subject: { select: { id: true, name: true } } },
    }),
    prisma.subject.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return <BookLibrary initialBooks={books} subjects={subjects} />;
}
