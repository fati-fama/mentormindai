export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function overallProgress(
  topics: { masteryLevel: number }[],
): number {
  if (topics.length === 0) return 0;
  const total = topics.reduce((sum, t) => sum + t.masteryLevel, 0);
  return Math.round(total / topics.length);
}

export function studyStreak(
  quizAttempts: { createdAt: Date }[],
): number {
  if (quizAttempts.length === 0) return 0;
  const days = new Set(
    quizAttempts.map((q) => new Date(q.createdAt).toDateString()),
  );
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else break;
  }
  return streak;
}

export function avgQuizScore(
  quizAttempts: { correctCount: number; totalQuestions: number }[],
): number {
  if (quizAttempts.length === 0) return 0;
  const total = quizAttempts.reduce(
    (sum, q) => sum + (q.totalQuestions > 0 ? (q.correctCount / q.totalQuestions) * 100 : 0),
    0,
  );
  return Math.round(total / quizAttempts.length);
}

interface WeekBucket {
  label: string;
  count: number;
}

export function weeklyBuckets(
  quizAttempts: { createdAt: Date; correctCount: number; totalQuestions: number }[],
): WeekBucket[] {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const buckets: WeekBucket[] = labels.map((l) => ({ label: l, count: 0 }));
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;

  for (const q of quizAttempts) {
    const d = new Date(q.createdAt);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= dayOfWeek && diffDays >= 0) {
      const idx = dayOfWeek - diffDays;
      buckets[idx].count++;
    }
  }
  return buckets;
}

export function weakestTopic(
  topics: { topic: { name: string }; masteryLevel: number }[],
): { name: string; mastery: number } | null {
  if (topics.length === 0) return null;
  const sorted = [...topics].sort((a, b) => a.masteryLevel - b.masteryLevel);
  return { name: sorted[0].topic.name, mastery: sorted[0].masteryLevel };
}

export function aiSuggestion(
  weakest: { name: string; mastery: number } | null,
  mistakeCount: number,
): string {
  if (weakest && weakest.mastery < 30) {
    return `Focus on ${weakest.name} — your mastery is at ${Math.round(weakest.mastery)}%. Ask your mentor to explain the fundamentals.`;
  }
  if (mistakeCount > 5) {
    return `You have ${mistakeCount} unresolved mistakes. Review them in the Mistake Bank to reinforce your weak areas.`;
  }
  if (weakest) {
    return `Keep practicing ${weakest.name} to push past ${Math.round(weakest.mastery)}% mastery. Try a quiz!`;
  }
  return "Start a conversation with your AI Mentor to begin building your learning profile.";
}
