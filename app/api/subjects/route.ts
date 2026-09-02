import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        topics: { orderBy: { name: "asc" }, select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      subjects: subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        topicCount: subject.topics.length,
        topics: subject.topics,
      })),
    });
  } catch (error) {
    console.error("Failed to load subjects:", error);
    return NextResponse.json({ error: "Could not load subjects" }, { status: 500 });
  }
}
