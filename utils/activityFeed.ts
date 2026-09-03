export interface ActivityEvent {
  type: "quiz" | "milestone" | "mistake";
  title: string;
  description: string;
  timestamp: Date;
}

interface QuizAttempt {
  topicName: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  createdAt: Date;
}

interface TopicProgress {
  topicName: string;
  masteryLevel: number;
}

interface Mistake {
  question: string;
  topicName: string;
  lastOccurredAt: Date;
}

export function buildActivityFeed(
  quizzes: QuizAttempt[],
  progress: TopicProgress[],
  mistakes: Mistake[],
): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const q of quizzes) {
    events.push({
      type: "quiz",
      title: `Quiz: ${q.topicName}`,
      description: `Scored ${q.score}% (${q.correctCount}/${q.totalQuestions})`,
      timestamp: q.createdAt,
    });
  }

  for (const p of progress) {
    const level = Math.round(p.masteryLevel);
    if (level >= 90) {
      events.push({
        type: "milestone",
        title: `${p.topicName} — Mastered`,
        description: `Reached ${level}% mastery. Excellent work!`,
        timestamp: new Date(),
      });
    } else if (level >= 75) {
      events.push({
        type: "milestone",
        title: `${p.topicName} — Advanced`,
        description: `Reached ${level}% mastery. Almost there!`,
        timestamp: new Date(),
      });
    } else if (level >= 50) {
      events.push({
        type: "milestone",
        title: `${p.topicName} — Progressing`,
        description: `Reached ${level}% mastery. Keep it up!`,
        timestamp: new Date(),
      });
    }
  }

  const mistakeTopics = new Map<string, number>();
  for (const m of mistakes) {
    mistakeTopics.set(m.topicName, (mistakeTopics.get(m.topicName) ?? 0) + 1);
  }
  for (const [topicName, count] of mistakeTopics) {
    if (count >= 3) {
      events.push({
        type: "mistake",
        title: `Repeated mistakes in ${topicName}`,
        description: `${count} mistakes recorded. Review your Mistake Bank.`,
        timestamp: new Date(),
      });
    }
  }

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
