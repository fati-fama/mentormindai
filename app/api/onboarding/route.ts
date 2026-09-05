import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { onboardingSchema } from "@/lib/schemas";

const STRENGTH_INITIAL_MASTERY = 60;
const WEAKNESS_INITIAL_MASTERY = 15;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const input = parsed.data;

  try {
    const subjectIds = [...new Set([...input.strengths, ...input.weaknesses])];
    if (subjectIds.length > 0) {
      const subjectCount = await prisma.subject.count({ where: { id: { in: subjectIds } } });
      if (subjectCount !== subjectIds.length) {
        return NextResponse.json({ error: "One or more selected subjects are invalid" }, { status: 400 });
      }
    }

    const updatedUser = await prisma.$transaction(
      async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            name: input.name,
            educationLevel: input.educationLevel,
            targetExam: input.targetExam,
            examDate: input.examDate,
            targetScore: input.targetScore,
            dailyStudyMinutes: input.dailyStudyMinutes,
            onboardingCompleted: true,
          },
        });

        const subjects = await tx.subject.findMany({
          where: { id: { in: subjectIds } },
          select: { id: true, topics: { select: { id: true } } },
        });

        const progressRecords = subjects.flatMap((subject) => {
          const isStrength = input.strengths.includes(subject.id);
          const masteryLevel = isStrength ? STRENGTH_INITIAL_MASTERY : WEAKNESS_INITIAL_MASTERY;
          return subject.topics.map((topic) => ({
            userId: user.id,
            topicId: topic.id,
            masteryLevel,
          }));
        });

        if (progressRecords.length > 0) {
          await tx.userTopicProgress.createMany({
            data: progressRecords,
            skipDuplicates: true,
          });
        }

        await tx.avatarMoodState.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            moodScore: 70,
            factors: {
              initialSetup: true,
              strengths: input.strengths.length,
              weaknesses: input.weaknesses.length,
              daysUntilExam: Math.ceil((input.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            },
          },
        });

        return tx.user.findUnique({
          where: { id: user.id },
          select: { id: true, email: true, name: true, onboardingCompleted: true },
        });
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Onboarding failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Prisma") || message.includes("database") || message.includes("connection")) {
      return NextResponse.json({ error: "Database error: could not save profile. Please try again." }, { status: 500 });
    }
    if (message.includes("unique") || message.includes("constraint")) {
      return NextResponse.json({ error: "Profile already exists. Please contact support." }, { status: 409 });
    }
    return NextResponse.json({ error: `Could not save your profile: ${message}` }, { status: 500 });
  }
}
