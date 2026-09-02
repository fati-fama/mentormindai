import { prisma } from "@/lib/prisma";
import { quizPayloadSchema, type QuizPayload } from "@/lib/schemas";
import {
  AI_FALLBACK_MESSAGE,
  buildSystemPrompt,
  buildUserPrompt,
  type PromptContext,
  type PromptMode,
} from "@/prompts/promptTemplates";

const DEFAULT_AI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_AI_MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 60_000;

export interface AiResponse {
  mode: PromptMode;
  content: string;
  quiz: QuizPayload | null;
  usedFallback: boolean;
}

async function loadPromptContext(userId: string, topicId: string): Promise<PromptContext | null> {
  const [user, topic] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        educationLevel: true,
        targetExam: true,
        examDate: true,
        targetScore: true,
      },
    }),
    prisma.topic.findUnique({
      where: { id: topicId },
      select: { name: true, subject: { select: { name: true } } },
    }),
  ]);

  if (!user || !topic) {
    return null;
  }

  const [progress, recentMistakes] = await Promise.all([
    prisma.userTopicProgress.findUnique({
      where: { userId_topicId: { userId, topicId } },
      select: { masteryLevel: true, accuracy: true },
    }),
    prisma.mistake.findMany({
      where: { userId, topicId },
      orderBy: { lastOccurredAt: "desc" },
      take: 5,
      select: { question: true, studentAnswer: true, correctAnswer: true, mistakeType: true },
    }),
  ]);

  return {
    studentName: user.name,
    educationLevel: user.educationLevel,
    targetExam: user.targetExam,
    examDate: user.examDate,
    targetScore: user.targetScore,
    subjectName: topic.subject.name,
    topicName: topic.name,
    masteryLevel: progress?.masteryLevel ?? 0,
    accuracy: progress?.accuracy ?? null,
    recentMistakes: recentMistakes.map((mistake) => ({
      question: mistake.question,
      studentAnswer: mistake.studentAnswer,
      correctAnswer: mistake.correctAnswer,
      mistakeType: mistake.mistakeType,
    })),
  };
}

async function callLlmApi(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured");
  }

  const baseUrl = (process.env.AI_BASE_URL ?? DEFAULT_AI_BASE_URL).replace(/\/+$/, "");
  const model = process.env.AI_MODEL ?? DEFAULT_AI_MODEL;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const statusText = await response.text().catch(() => "");
      throw new Error(`LLM API responded with status ${response.status}: ${statusText.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("LLM API returned an empty response");
    }
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

function extractJsonContent(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in the LLM response");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function parseQuizPayload(raw: string): QuizPayload {
  const parsed = quizPayloadSchema.safeParse(extractJsonContent(raw));
  if (!parsed.success) {
    throw new Error(`Quiz response failed validation: ${parsed.error.issues[0]?.message}`);
  }
  return parsed.data;
}

export async function generatePersonalizedResponse(
  userId: string,
  topicId: string,
  userQuery: string,
  mode: PromptMode,
): Promise<AiResponse> {
  const context = await loadPromptContext(userId, topicId);
  if (!context) {
    throw new Error("Topic not found for this request");
  }

  try {
    const content = await callLlmApi(buildSystemPrompt(mode, context), buildUserPrompt(mode, context, userQuery));

    if (mode === "quiz") {
      const quiz = parseQuizPayload(content);
      return { mode, content: JSON.stringify(quiz, null, 2), quiz, usedFallback: false };
    }

    return { mode, content, quiz: null, usedFallback: false };
  } catch (error) {
    console.error(`AI generation failed (mode=${mode}, topicId=${topicId}):`, error);
    return { mode, content: AI_FALLBACK_MESSAGE, quiz: null, usedFallback: true };
  }
}
