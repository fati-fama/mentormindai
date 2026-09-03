import { prisma } from "@/lib/prisma";
import { callLlmApi, extractJsonContent } from "@/services/aiService";

export interface StudyPlanDay {
  day: string;
  focus: string;
  tasks: string[];
  duration: number;
  priority: "high" | "medium" | "low";
}

export interface StudyPlan {
  summary: string;
  daysUntilExam: number;
  weeklyPlan: StudyPlanDay[];
  recommendations: string[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

function buildFallbackPlan(
  topics: Array<{ name: string; subjectName: string; masteryLevel: number }>,
  dailyMinutes: number,
  examDate: Date | null,
): StudyPlan {
  const sorted = [...topics].sort((a, b) => a.masteryLevel - b.masteryLevel);
  const daysUntilExam = examDate
    ? Math.max(1, Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  const weeklyPlan: StudyPlanDay[] = DAYS.map((day, i) => {
    const topic = sorted[i % sorted.length];
    const priority: StudyPlanDay["priority"] =
      i < 2 ? "high" : i < 5 ? "medium" : "low";
    return {
      day,
      focus: topic ? `${topic.subjectName} — ${topic.name}` : "Review & Practice",
      tasks: topic
        ? [
            `Review ${topic.name} concepts`,
            `Practice problems on ${topic.name}`,
            "Review past mistakes",
          ]
        : ["General review", "Practice weak areas"],
      duration: dailyMinutes,
      priority,
    };
  });

  return {
    summary: `Study plan focused on weakest topics. ${daysUntilExam} days until exam.`,
    daysUntilExam,
    weeklyPlan,
    recommendations: [
      "Focus on weakest topics first",
      "Review mistakes daily",
      "Take short breaks every 25 minutes",
    ],
  };
}

export async function generateStudyPlan(userId: string): Promise<StudyPlan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      educationLevel: true,
      targetExam: true,
      examDate: true,
      targetScore: true,
      dailyStudyMinutes: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const topics = await prisma.topic.findMany({
    include: {
      subject: { select: { name: true } },
      progress: {
        where: { userId },
        select: { masteryLevel: true },
      },
    },
  });

  const topicData = topics.map((t) => ({
    name: t.name,
    subjectName: t.subject.name,
    masteryLevel: t.progress[0]?.masteryLevel ?? 0,
  }));

  const dailyMinutes = user.dailyStudyMinutes ?? 120;

  const systemPrompt =
    "You are an expert academic study planner. Output ONLY valid JSON matching this schema: { \"summary\": string, \"daysUntilExam\": number, \"weeklyPlan\": [ { \"day\": string, \"focus\": string, \"tasks\": string[], \"duration\": number, \"priority\": \"high\"|\"medium\"|\"low\" } ], \"recommendations\": string[] }";

  const daysUntilExam = user.examDate
    ? Math.max(1, Math.ceil((user.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  const userPrompt = `Create a 7-day study plan for ${user.name ?? "the student"}.
Education level: ${user.educationLevel ?? "unknown"}
Target exam: ${user.targetExam ?? "unknown"} — ${daysUntilExam} days away
Target score: ${user.targetScore ?? "unknown"}
Daily study time: ${dailyMinutes} minutes

Topics and current mastery levels:
${topicData.map((t) => `- ${t.subjectName} > ${t.name}: ${Math.round(t.masteryLevel)}%`).join("\n")}

Prioritize weakest topics. Distribute study time across the week. Include specific actionable tasks per day.`;

  try {
    const { content: raw } = await callLlmApi(systemPrompt, userPrompt, []);
    const parsed = extractJsonContent(raw) as Record<string, unknown>;

    const weeklyPlan = parsed.weeklyPlan as StudyPlanDay[] | undefined;
    if (!Array.isArray(weeklyPlan) || weeklyPlan.length === 0) {
      throw new Error("Invalid weekly plan in AI response");
    }

    return {
      summary: (parsed.summary as string) ?? "AI-generated study plan",
      daysUntilExam: (parsed.daysUntilExam as number) ?? daysUntilExam,
      weeklyPlan: weeklyPlan.map((day, i) => ({
        day: day.day ?? DAYS[i] ?? `Day ${i + 1}`,
        focus: day.focus ?? "General study",
        tasks: Array.isArray(day.tasks) ? day.tasks : ["Review material"],
        duration: typeof day.duration === "number" ? day.duration : dailyMinutes,
        priority: (["high", "medium", "low"].includes(day.priority) ? day.priority : "medium") as StudyPlanDay["priority"],
      })),
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (error) {
    console.warn("AI study plan failed, using fallback:", error);
    return buildFallbackPlan(topicData, dailyMinutes, user.examDate);
  }
}
