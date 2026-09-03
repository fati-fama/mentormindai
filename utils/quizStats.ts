export interface QuizRecord {
  topicId: string;
  topicName: string;
  subjectName: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  createdAt: Date;
}

export function bestTopic(quizzes: QuizRecord[]): string | null {
  if (quizzes.length === 0) return null;
  const topicScores = new Map<string, { total: number; count: number; name: string }>();
  for (const q of quizzes) {
    const entry = topicScores.get(q.topicId) ?? { total: 0, count: 0, name: q.topicName };
    entry.total += q.score;
    entry.count++;
    topicScores.set(q.topicId, entry);
  }
  let best: { avg: number; name: string } | null = null;
  for (const [, entry] of topicScores) {
    const avg = entry.total / entry.count;
    if (!best || avg > best.avg) best = { avg, name: entry.name };
  }
  return best?.name ?? null;
}

export function worstTopic(quizzes: QuizRecord[]): string | null {
  if (quizzes.length === 0) return null;
  const topicScores = new Map<string, { total: number; count: number; name: string }>();
  for (const q of quizzes) {
    const entry = topicScores.get(q.topicId) ?? { total: 0, count: 0, name: q.topicName };
    entry.total += q.score;
    entry.count++;
    topicScores.set(q.topicId, entry);
  }
  let worst: { avg: number; name: string } | null = null;
  for (const [, entry] of topicScores) {
    const avg = entry.total / entry.count;
    if (!worst || avg < worst.avg) worst = { avg, name: entry.name };
  }
  return worst?.name ?? null;
}

export function topicQuizCounts(quizzes: QuizRecord[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const q of quizzes) {
    counts.set(q.topicId, (counts.get(q.topicId) ?? 0) + 1);
  }
  return counts;
}

export function scoreDistribution(quizzes: QuizRecord[]): { label: string; count: number }[] {
  const buckets = [
    { label: "0-25%", count: 0 },
    { label: "26-50%", count: 0 },
    { label: "51-75%", count: 0 },
    { label: "76-100%", count: 0 },
  ];
  for (const q of quizzes) {
    if (q.score <= 25) buckets[0].count++;
    else if (q.score <= 50) buckets[1].count++;
    else if (q.score <= 75) buckets[2].count++;
    else buckets[3].count++;
  }
  return buckets;
}
