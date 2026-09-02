export const PROMPT_MODES = ["explain", "teach", "hint", "quiz", "mistake-analysis"] as const;
export type PromptMode = (typeof PROMPT_MODES)[number];

export const MODE_LABELS: Record<PromptMode, string> = {
  explain: "Explain",
  teach: "Teach me",
  hint: "Give me a hint",
  quiz: "Quiz me",
  "mistake-analysis": "Analyze my mistake",
};

export interface RecentMistake {
  question: string;
  studentAnswer: string;
  correctAnswer: string | null;
  mistakeType: string;
}

export interface PromptContext {
  studentName: string | null;
  educationLevel: string | null;
  targetExam: string | null;
  examDate: Date | null;
  targetScore: string | null;
  subjectName: string;
  topicName: string;
  masteryLevel: number;
  accuracy: number | null;
  recentMistakes: RecentMistake[];
}

export interface MasteryTier {
  label: string;
  difficulty: "easy" | "medium" | "hard";
  guidance: string;
}

export const AI_FALLBACK_MESSAGE =
  "Your mentor is temporarily unavailable. Please try again in a moment — your progress is saved.";

const PERSONALITY_PROMPT = `You are MentorMind, a personal AI study mentor. Your personality: supportive, direct, and academically rigorous.
You genuinely believe the student can master the material, but you never lower academic standards or skip rigor.
You address the student by name when known. You never invent facts — if unsure, you say so and explain how the student can verify.`;

function formatMasteryTier(masteryLevel: number): MasteryTier {
  if (masteryLevel <= 40) {
    return {
      label: "Beginner",
      difficulty: "easy",
      guidance:
        "The student is a beginner on this topic. Use simple language, build from first principles, define every term you introduce, and include a worked example.",
    };
  }
  if (masteryLevel <= 60) {
    return {
      label: "Developing",
      difficulty: "easy",
      guidance:
        "The student is developing their understanding. Connect the idea to fundamentals they likely know, then extend one step further. Include one example.",
    };
  }
  if (masteryLevel < 91) {
    return {
      label: "Advanced",
      difficulty: "medium",
      guidance:
        "The student is advanced on this topic. Be efficient and precise; include edge cases, common traps, and one challenging example.",
    };
  }
  return {
    label: "Mastery",
    difficulty: "hard",
    guidance:
      "The student is near mastery on this topic. Push them with exam-level rigor, subtle distinctions, and multi-step problems that integrate other concepts.",
  };
}

function formatStudentProfile(context: PromptContext): string {
  const lines: string[] = [];
  lines.push(`Topic: ${context.topicName} (${context.subjectName})`);
  lines.push(`Mastery level: ${Math.round(context.masteryLevel)}% — ${formatMasteryTier(context.masteryLevel).label}`);
  if (context.accuracy !== null) {
    lines.push(`Recent accuracy on this topic: ${Math.round(context.accuracy)}%`);
  }
  if (context.studentName) {
    lines.push(`Student name: ${context.studentName}`);
  }
  if (context.educationLevel) {
    lines.push(`Education level: ${context.educationLevel}`);
  }
  if (context.targetExam) {
    const examLine = `Preparing for: ${context.targetExam}`;
    lines.push(
      context.targetScore ? `${examLine} (target score: ${context.targetScore})` : examLine,
    );
  }
  if (context.examDate) {
    const days = Math.ceil((context.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days > 0) {
      lines.push(`Exam is in ${days} day${days === 1 ? "" : "s"} (${context.examDate.toISOString().slice(0, 10)})`);
    }
  }
  return lines.join("\n");
}

function formatRecentMistakes(context: PromptContext): string {
  if (context.recentMistakes.length === 0) {
    return "No recent mistakes recorded on this topic.";
  }
  const items = context.recentMistakes
    .map(
      (mistake, index) =>
        `${index + 1}. Question: "${mistake.question}"\n   Student answered: "${mistake.studentAnswer}"${
          mistake.correctAnswer ? `\n   Correct answer: "${mistake.correctAnswer}"` : ""
        }\n   Mistake type: ${mistake.mistakeType}`,
    )
    .join("\n");
  return `Recent mistakes on this topic (most recent first):\n${items}`;
}

const MODE_INSTRUCTIONS: Record<PromptMode, string> = {
  explain: `Mode: EXPLAIN.
Give a clear, step-by-step explanation of the concept the student asks about. Structure it as numbered steps.
Adapt depth to the student's mastery level as described in their profile. End with a one-sentence summary and one quick check-question the student can use to test their understanding.`,

  teach: `Mode: TEACH (Socratic).
Do NOT give a direct answer or full explanation. Instead, guide the student to discover the answer themselves.
Respond with 2-3 open-ended questions that move their thinking forward, referencing what they already know from their profile.
If their question shows a misconception, ask a question that exposes the contradiction. Keep it warm but concise.`,

  hint: `Mode: HINT (progressive, staged).
Do NOT reveal the full answer. Provide staged hints:
- Hint 1: a gentle nudge toward the right direction (no formulas or key steps yet)
- Hint 2: the strategy or key relationship to use
- Hint 3: a near-complete setup that leaves only the final computation to the student
Format each hint on its own line, clearly labeled "Hint 1:", "Hint 2:", "Hint 3:".
If the student's message shows they already tried something, tailor the hints to unstick their specific approach.`,

  quiz: `Mode: QUIZ.
Generate practice questions on the topic, matched to the student's mastery level and influenced by their recent mistakes (re-test the same skills with different numbers or phrasing).
You MUST respond with ONLY a valid JSON object — no markdown fences, no commentary — in exactly this shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"...","difficulty":"easy|medium|hard"}]}
Rules: exactly 4 options per question; correctIndex is the 0-based index of the correct option; every option is plausible; explanations say why the correct option is right and why the tempting wrong options are wrong; difficulty must match the student's tier; produce 5 questions unless the student asks for a different number.`,

  "mistake-analysis": `Mode: MISTAKE ANALYSIS.
The student is showing you a mistake (either one they describe, or one from their recent mistakes list). Analyze it:
1. Identify the exact step where things went wrong.
2. Name the mistake type (conceptual, calculation, formula recall, misreading the question, procedural, careless, guessing).
3. Explain the underlying misconception in plain language.
4. Show the corrected approach step by step.
5. Give one similar practice question (with its answer hidden under a clearly labeled "Answer:" line at the end).
Be kind but honest — never blame the student, but never soften the rigor.`,
};

export function buildSystemPrompt(mode: PromptMode, context: PromptContext): string {
  const tier = formatMasteryTier(context.masteryLevel);
  return [
    PERSONALITY_PROMPT,
    "",
    "STUDENT PROFILE (use this to personalize every response):",
    formatStudentProfile(context),
    "",
    `Mastery tier guidance: ${tier.guidance}`,
    "",
    formatRecentMistakes(context),
    "",
    MODE_INSTRUCTIONS[mode],
  ].join("\n");
}

export function buildUserPrompt(mode: PromptMode, context: PromptContext, userQuery: string): string {
  const name = context.studentName ? `${context.studentName} asks` : "The student asks";
  const prefix =
    mode === "mistake-analysis"
      ? `${name} about a mistake on ${context.topicName}:`
      : `${name} about ${context.topicName} (${context.subjectName}):`;
  return `${prefix}\n\n${userQuery}`;
}

export function getMasteryTier(masteryLevel: number): MasteryTier {
  return formatMasteryTier(masteryLevel);
}
