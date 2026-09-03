import { prisma } from "@/lib/prisma";

export type MoodLabel = "HAPPY" | "NEUTRAL" | "SAD";

export type MoodFactors = {
  accuracyAvg: number | null;
  masteryAvg: number;
  improvingTopicCount: number;
  decliningTopicCount: number;
  repeatedMistakeCount: number;
  daysSinceLastActivity: number | null;
  dailyStudyMinutes: number | null;
};

export type MoodResult = {
  mood: MoodLabel;
  score: number;
  reason: string;
  factors: MoodFactors;
};

const ACTIVITY_WINDOW_DAYS = 14;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function buildReason(mood: MoodLabel, factors: MoodFactors, worstTopicName: string | null): string {
  if (mood === "HAPPY") {
    if (factors.accuracyAvg !== null && factors.accuracyAvg >= 75) {
      return `Your accuracy has been strong lately — keep this momentum going.`;
    }
    if (factors.improvingTopicCount > factors.decliningTopicCount) {
      return `More of your topics are improving than slipping. Great progress.`;
    }
    return `Your learning trend is looking healthy — keep it up.`;
  }

  if (mood === "SAD") {
    const reasons: string[] = [];
    if (factors.repeatedMistakeCount > 0) {
      reasons.push(
        `${factors.repeatedMistakeCount} mistake${factors.repeatedMistakeCount === 1 ? "" : "s"} keep coming back`,
      );
    }
    if (worstTopicName) {
      reasons.push(`${worstTopicName} accuracy has been slipping`);
    }
    if (factors.daysSinceLastActivity !== null && factors.daysSinceLastActivity > 3) {
      reasons.push(`you haven't studied in ${factors.daysSinceLastActivity} days`);
    }
    if (reasons.length === 0) {
      reasons.push(`your recent results have been uneven`);
    }
    return `Your avatar looks a little concerned because ${reasons.join(", ")}. Let's do a short focused session to get back on track.`;
  }

  return `Your progress is steady. A focused session today will push more topics toward mastery.`;
}

export async function recalculateMood(userId: string): Promise<MoodResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [user, recentQuizzes, progressRows, repeatedMistakes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { dailyStudyMinutes: true, topicProgress: { select: { lastPracticedAt: true } } },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { score: true, topicId: true },
    }),
    prisma.userTopicProgress.findMany({
      where: { userId },
      select: { masteryLevel: true, accuracy: true, lastPracticedAt: true },
    }),
    prisma.mistake.findMany({
      where: { userId, resolved: false, repetitionCount: { gte: 2 } },
      select: { topicId: true },
    }),
  ]);

  const accuracies = recentQuizzes.map((q) => q.score);
  const accuracyAvg =
    accuracies.length === 0 ? null : accuracies.reduce((a, b) => a + b, 0) / accuracies.length;

  const masteryValues = progressRows.map((p) => p.masteryLevel);
  const masteryAvg =
    masteryValues.length === 0
      ? 0
      : masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length;

  let improvingTopicCount = 0;
  let decliningTopicCount = 0;
  for (const row of progressRows) {
    if (row.accuracy === null) continue;
    if (row.accuracy > row.masteryLevel + 5) improvingTopicCount++;
    else if (row.accuracy < row.masteryLevel - 5) decliningTopicCount++;
  }

  const lastActivityDates = progressRows
    .map((p) => p.lastPracticedAt)
    .filter((d): d is Date => d !== null);
  const mostRecent =
    lastActivityDates.length === 0
      ? null
      : new Date(Math.max(...lastActivityDates.map((d) => d.getTime())));
  const daysSinceLastActivity = mostRecent
    ? Math.floor((now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const repeatedMistakeCount = repeatedMistakes.length;

  const factors: MoodFactors = {
    accuracyAvg,
    masteryAvg,
    improvingTopicCount,
    decliningTopicCount,
    repeatedMistakeCount,
    daysSinceLastActivity,
    dailyStudyMinutes: user?.dailyStudyMinutes ?? null,
  };

  let score = 55;
  if (accuracyAvg !== null) score += (accuracyAvg - 60) * 0.5;
  score += (masteryAvg - 50) * 0.25;
  score += (improvingTopicCount - decliningTopicCount) * 4;
  score -= repeatedMistakeCount * 4;
  if (daysSinceLastActivity !== null) {
    if (daysSinceLastActivity > 7) score -= 15;
    else if (daysSinceLastActivity > 3) score -= 8;
    else if (daysSinceLastActivity <= 1) score += 5;
  }
  score = clampScore(score);

  let mood: MoodLabel;
  if (score >= 70) mood = "HAPPY";
  else if (score >= 45) mood = "NEUTRAL";
  else mood = "SAD";

  let worstTopicName: string | null = null;
  if (mood !== "HAPPY") {
    const worst = await prisma.userTopicProgress.findFirst({
      where: { userId },
      orderBy: { masteryLevel: "asc" },
      select: { topic: { select: { name: true } } },
    });
    worstTopicName = worst?.topic.name ?? null;
  }

  const reason = buildReason(mood, factors, worstTopicName);

  const factorsJson = JSON.parse(JSON.stringify(factors));

  await prisma.avatarMoodState.upsert({
    where: { userId },
    update: {
      currentMood: mood,
      moodScore: score,
      moodReason: reason,
      factors: factorsJson,
    },
    create: {
      userId,
      currentMood: mood,
      moodScore: score,
      moodReason: reason,
      factors: factorsJson,
    },
  });

  return { mood, score, reason, factors };
}

export async function getCurrentMood(userId: string): Promise<MoodResult> {
  const state = await prisma.avatarMoodState.findUnique({ where: { userId } });
  if (!state) {
    return {
      mood: "NEUTRAL",
      score: 70,
      reason: "Your mentor is ready to help you learn.",
      factors: {
        accuracyAvg: null,
        masteryAvg: 0,
        improvingTopicCount: 0,
        decliningTopicCount: 0,
        repeatedMistakeCount: 0,
        daysSinceLastActivity: null,
        dailyStudyMinutes: null,
      },
    };
  }
  return {
    mood: state.currentMood as MoodLabel,
    score: state.moodScore,
    reason: state.moodReason,
    factors: (state.factors ?? {}) as MoodFactors,
  };
}
