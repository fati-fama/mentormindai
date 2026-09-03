import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { quizSubmitSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";
import { recalculateMood } from "@/services/moodService";

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

  const parsed = quizSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { topicId, questions, answers } = parsed.data;

  const results = answers.map((answer) => {
    const question = questions[answer.questionIndex];
    const isCorrect = question ? answer.selectedIndex === question.correctIndex : false;
    return {
      questionIndex: answer.questionIndex,
      selectedIndex: answer.selectedIndex,
      correctIndex: question?.correctIndex ?? -1,
      isCorrect,
    };
  });

  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      topicId,
      correctCount,
      totalQuestions,
      score,
      details: JSON.parse(JSON.stringify({ results, questions })),
    },
  });

  const wrongAnswers = results.filter((r) => !r.isCorrect);
  for (const wrong of wrongAnswers) {
    const question = questions[wrong.questionIndex];
    if (!question) continue;

    const existing = await prisma.mistake.findFirst({
      where: {
        userId: user.id,
        topicId,
        question: question.question,
        resolved: false,
      },
    });

    if (existing) {
      await prisma.mistake.update({
        where: { id: existing.id },
        data: {
          repetitionCount: { increment: 1 },
          lastOccurredAt: new Date(),
          studentAnswer: question.options[wrong.selectedIndex] ?? `Option ${wrong.selectedIndex}`,
        },
      });
    } else {
      await prisma.mistake.create({
        data: {
          userId: user.id,
          topicId,
          question: question.question,
          studentAnswer: question.options[wrong.selectedIndex] ?? `Option ${wrong.selectedIndex}`,
          correctAnswer: question.options[question.correctIndex] ?? null,
          mistakeType: "OTHER",
          explanation: question.explanation,
        },
      });
    }
  }

  const allAttempts = await prisma.quizAttempt.findMany({
    where: { userId: user.id, topicId },
    select: { score: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const recentAvgScore =
    allAttempts.length > 0
      ? allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length
      : score;

  const existingProgress = await prisma.userTopicProgress.findUnique({
    where: { userId_topicId: { userId: user.id, topicId } },
  });

  const masteryDelta = score >= 80 ? 5 : score >= 60 ? 2 : score >= 40 ? 0 : -3;
  const newMastery = Math.max(0, Math.min(100, (existingProgress?.masteryLevel ?? 0) + masteryDelta));

  await prisma.userTopicProgress.upsert({
    where: { userId_topicId: { userId: user.id, topicId } },
    update: {
      masteryLevel: newMastery,
      accuracy: recentAvgScore,
      attemptCount: { increment: 1 },
      lastPracticedAt: new Date(),
    },
    create: {
      userId: user.id,
      topicId,
      masteryLevel: newMastery,
      accuracy: recentAvgScore,
      attemptCount: 1,
      lastPracticedAt: new Date(),
    },
  });

  void recalculateMood(user.id);

  return NextResponse.json({
    correctCount,
    totalQuestions,
    score,
    results,
    masteryLevel: newMastery,
  });
}
