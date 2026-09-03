import { prisma } from "@/lib/prisma";
import { MentorChat } from "@/components/chat/MentorChat";

export const metadata = { title: "AI Mentor" };

export default async function MentorPage() {
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

  if (topics.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm text-slate-600">
          No topics available yet. Please contact your administrator to set up subjects and topics.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <MentorChat topics={topics} />
    </div>
  );
}
