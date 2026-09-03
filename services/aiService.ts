import { prisma } from "@/lib/prisma";
import { quizPayloadSchema, type QuizPayload } from "@/lib/schemas";
import {
  AI_FALLBACK_MESSAGE,
  buildSystemPrompt,
  buildUserPrompt,
  type PromptContext,
  type PromptMode,
} from "@/prompts/promptTemplates";
import { getCurrentMood, recalculateMood } from "@/services/moodService";

const REQUEST_TIMEOUT_MS = 60_000;

export type HistoryMessage = { role: "user" | "assistant"; content: string };
export type AiProviderName = "OpenAI" | "Groq" | "Gemini";

export interface AiResponse {
  mode: PromptMode;
  content: string;
  quiz: QuizPayload | null;
  usedFallback: boolean;
  provider?: string;
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
      select: { name: true, subjectId: true, subject: { select: { name: true } } },
    }),
  ]);

  if (!user || !topic) {
    return null;
  }

  const [progress, recentMistakes, primaryBook, moodInfo] = await Promise.all([
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
    prisma.book.findFirst({
      where: { userId, subjectId: topic.subjectId, isPrimaryReference: true },
      select: { title: true, author: true, edition: true },
    }),
    getCurrentMood(userId),
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
    primaryBook: primaryBook
      ? { title: primaryBook.title, author: primaryBook.author, edition: primaryBook.edition }
      : null,
    moodInfo: { mood: moodInfo.mood, reason: moodInfo.reason },
  };
}

interface ProviderConfig {
  name: AiProviderName;
  apiKey: string;
  model: string;
  call: (systemPrompt: string, userPrompt: string, history: HistoryMessage[]) => Promise<string>;
  callStream: (systemPrompt: string, userPrompt: string, history: HistoryMessage[]) => Promise<ReadableStream<string>>;
}

async function callOpenAICompatible(
  baseUrl: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  history: HistoryMessage[],
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userPrompt },
    ];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.4 }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`${response.status}: ${text.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAICompatibleStream(
  baseUrl: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  history: HistoryMessage[],
): Promise<ReadableStream<string>> {
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userPrompt },
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.4, stream: true }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${response.status}: ${text.slice(0, 300)}`);
  }

  if (!response.body) throw new Error("No response body for streaming");

  return decodeSSEStream(response.body, (data) => {
    if (data === "[DONE]") return null;
    try {
      const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
      return parsed.choices?.[0]?.delta?.content ?? null;
    } catch {
      return null;
    }
  });
}

async function callGemini(
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  history: HistoryMessage[],
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const contents = [
      ...history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: userPrompt }] },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.4 },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`${response.status}: ${text.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Empty response");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

async function callGeminiStream(
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  history: HistoryMessage[],
): Promise<ReadableStream<string>> {
  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userPrompt }] },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.4 },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${response.status}: ${text.slice(0, 300)}`);
  }

  if (!response.body) throw new Error("No response body for streaming");

  return decodeSSEStream(response.body, (data) => {
    try {
      const parsed = JSON.parse(data) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      return parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch {
      return null;
    }
  });
}

function decodeSSEStream(
  body: ReadableStream<Uint8Array>,
  parse: (data: string) => string | null,
): ReadableStream<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<string>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const chunk = parse(line.slice(6).trim());
          if (chunk) controller.enqueue(chunk);
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

export function getAvailableProviders(): Array<{ name: AiProviderName; model: string; configured: boolean }> {
  const result: Array<{ name: AiProviderName; model: string; configured: boolean }> = [];

  const openaiKey = process.env.OPENAI_API_KEY;
  result.push({
    name: "OpenAI",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    configured: !!openaiKey,
  });

  const groqKey = process.env.GROQ_API_KEY;
  result.push({
    name: "Groq",
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    configured: !!groqKey,
  });

  const geminiKey = process.env.GEMINI_API_KEY;
  result.push({
    name: "Gemini",
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    configured: !!geminiKey,
  });

  return result;
}

function mapPreferredProvider(raw: string | null | undefined): AiProviderName | null {
  if (!raw || raw === "AUTO") return null;
  const map: Record<string, AiProviderName> = {
    OPENAI: "OpenAI",
    GROQ: "Groq",
    GEMINI: "Gemini",
    OpenAI: "OpenAI",
    Groq: "Groq",
    Gemini: "Gemini",
  };
  return map[raw] ?? null;
}

function getProviders(preferred?: string | null): ProviderConfig[] {
  const allProviders: ProviderConfig[] = [];

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    allProviders.push({
      name: "OpenAI",
      apiKey: openaiKey,
      model,
      call: (sys, usr, hist) =>
        callOpenAICompatible("https://api.openai.com/v1", model, openaiKey, sys, usr, hist),
      callStream: (sys, usr, hist) =>
        callOpenAICompatibleStream("https://api.openai.com/v1", model, openaiKey, sys, usr, hist),
    });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
    allProviders.push({
      name: "Groq",
      apiKey: groqKey,
      model,
      call: (sys, usr, hist) =>
        callOpenAICompatible("https://api.groq.com/openai/v1", model, groqKey, sys, usr, hist),
      callStream: (sys, usr, hist) =>
        callOpenAICompatibleStream("https://api.groq.com/openai/v1", model, groqKey, sys, usr, hist),
    });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    allProviders.push({
      name: "Gemini",
      apiKey: geminiKey,
      model,
      call: (sys, usr, hist) => callGemini(model, geminiKey, sys, usr, hist),
      callStream: (sys, usr, hist) => callGeminiStream(model, geminiKey, sys, usr, hist),
    });
  }

  if (!preferred || preferred === "AUTO") return allProviders;

  const mapped = mapPreferredProvider(preferred);
  if (!mapped) return allProviders;

  const preferredIdx = allProviders.findIndex((p) => p.name === mapped);
  if (preferredIdx <= 0) return allProviders;

  const reordered = [allProviders[preferredIdx], ...allProviders.filter((_, i) => i !== preferredIdx)];
  return reordered;
}

export async function callLlmApi(
  systemPrompt: string,
  userPrompt: string,
  history: HistoryMessage[],
  preferred?: string | null,
): Promise<{ content: string; provider: string }> {
  const providers = getProviders(preferred);

  console.log("[AI] Providers available:", providers.map(p => ({ name: p.name, model: p.model, configured: !!p.apiKey })));
  console.log("[AI] Key check:", {
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  });

  if (providers.length === 0) {
    throw new Error("No AI provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY in .env");
  }

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      console.log(`[AI] Trying provider: ${provider.name} with model: ${provider.model}`);
      const startTime = Date.now();
      const content = await provider.call(systemPrompt, userPrompt, history);
      console.log(`[AI] ${provider.name} responded in ${Date.now() - startTime}ms`);
      return { content, provider: provider.name };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${provider.name}: ${msg}`);
      console.warn(`[AI] ${provider.name} failed:`, msg.slice(0, 200));
    }
  }

  throw new Error(`All AI providers failed: ${errors.join("; ")}`);
}

export async function callLlmApiStream(
  systemPrompt: string,
  userPrompt: string,
  history: HistoryMessage[],
  preferred?: string | null,
): Promise<{ stream: ReadableStream<string>; provider: string }> {
  const providers = getProviders(preferred);

  console.log("[AI Stream] Providers available:", providers.map(p => ({ name: p.name, model: p.model, configured: !!p.apiKey })));
  console.log("[AI Stream] Key check:", {
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  });

  if (providers.length === 0) {
    throw new Error("No AI provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY in .env");
  }

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      console.log(`[AI Stream] Trying provider: ${provider.name} with model: ${provider.model}`);
      const startTime = Date.now();
      const stream = await provider.callStream(systemPrompt, userPrompt, history);
      console.log(`[AI Stream] ${provider.name} connected in ${Date.now() - startTime}ms`);
      return { stream, provider: provider.name };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${provider.name}: ${msg}`);
      console.warn(`[AI Stream] ${provider.name} failed (${Date.now()}ms):`, msg.slice(0, 200));
    }
  }

  throw new Error(`All AI providers failed for streaming: ${errors.join("; ")}`);
}

export function extractJsonContent(raw: string): unknown {
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

export async function generateStandaloneQuiz(
  userId: string,
  topicId: string,
  difficulty: "easy" | "medium" | "hard" = "medium",
  count: number = 5,
): Promise<QuizPayload | null> {
  const [user, topic] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { educationLevel: true, targetExam: true },
    }),
    prisma.topic.findUnique({
      where: { id: topicId },
      select: { name: true, subject: { select: { name: true } } },
    }),
  ]);

  if (!user || !topic) return null;

  const systemPrompt =
    "You are an expert quiz generator. Output ONLY valid JSON matching this schema: { \"questions\": [ { \"question\": string, \"options\": [string, string, string, string], \"correctIndex\": number (0-3), \"explanation\": string, \"difficulty\": \"easy\"|\"medium\"|\"hard\" } ] }";

  const userPrompt = `Generate exactly ${count} ${difficulty}-difficulty quiz questions about "${topic.name}" in ${topic.subject.name}. Student level: ${user.educationLevel ?? "unknown"}. Exam: ${user.targetExam ?? "general"}. Ensure questions test understanding, not just recall.`;

  try {
    const { content: raw } = await callLlmApi(systemPrompt, userPrompt, []);
    return parseQuizPayload(raw);
  } catch (error) {
    console.error(`Standalone quiz generation failed (topicId=${topicId}):`, error);
    return null;
  }
}

export async function generatePersonalizedResponse(
  userId: string,
  topicId: string,
  userQuery: string,
  mode: PromptMode,
  history: HistoryMessage[] = [],
): Promise<AiResponse> {
  const [context, userPref] = await Promise.all([
    loadPromptContext(userId, topicId),
    prisma.user.findUnique({ where: { id: userId }, select: { preferredAiProvider: true } }),
  ]);
  if (!context) {
    throw new Error("Topic not found for this request");
  }

  const preferred = userPref?.preferredAiProvider;

  try {
    const { content, provider } = await callLlmApi(
      buildSystemPrompt(mode, context),
      buildUserPrompt(mode, context, userQuery),
      history,
      preferred,
    );

    if (mode === "quiz") {
      const quiz = parseQuizPayload(content);
      void recalculateMood(userId);
      return { mode, content: "", quiz, usedFallback: false, provider };
    }

    void recalculateMood(userId);
    return { mode, content, quiz: null, usedFallback: false, provider };
  } catch (error) {
    console.error(`AI generation failed (mode=${mode}, topicId=${topicId}):`, error);
    return { mode, content: AI_FALLBACK_MESSAGE, quiz: null, usedFallback: true };
  }
}

export async function generatePersonalizedStream(
  userId: string,
  topicId: string,
  userQuery: string,
  mode: PromptMode,
  history: HistoryMessage[] = [],
): Promise<{ stream: ReadableStream<string>; provider: string }> {
  if (mode === "quiz") {
    throw new Error("Streaming is not supported for quiz mode");
  }

  const [context, userPref] = await Promise.all([
    loadPromptContext(userId, topicId),
    prisma.user.findUnique({ where: { id: userId }, select: { preferredAiProvider: true } }),
  ]);
  if (!context) {
    throw new Error("Topic not found for this request");
  }

  const preferred = userPref?.preferredAiProvider;

  const { stream, provider } = await callLlmApiStream(
    buildSystemPrompt(mode, context),
    buildUserPrompt(mode, context, userQuery),
    history,
    preferred,
  );

  void recalculateMood(userId);
  return { stream, provider };
}
