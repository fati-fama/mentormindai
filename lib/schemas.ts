import { z } from "zod";
import { PROMPT_MODES } from "@/prompts/promptTemplates";

export const EDUCATION_LEVELS = [
  "High School",
  "College / Intermediate",
  "Undergraduate",
  "Postgraduate",
  "Professional Certification",
  "Other",
] as const;

export const TARGET_EXAMS = [
  "SAT",
  "ACT",
  "GRE",
  "GMAT",
  "IELTS",
  "TOEFL",
  "GCSE",
  "A-Level",
  "IB",
  "AP",
  "JEE",
  "NEET",
  "GATE",
  "Other",
] as const;

export const STUDY_TIME_OPTIONS = [30, 60, 90, 120, 180, 240, 300, 360, 480] as const;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const onboardingSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name").max(60),
    educationLevel: z.enum(EDUCATION_LEVELS, "Select your education level"),
    targetExam: z.string().trim().min(1, "Select your target exam").max(60),
    examDate: z.coerce
      .date()
      .refine((date) => date.getTime() > Date.now(), "Exam date must be in the future"),
    targetScore: z.string().trim().min(1, "Enter your target score").max(40),
    dailyStudyMinutes: z.coerce
      .number()
      .int()
      .min(15, "Minimum 15 minutes per day")
      .max(960, "Maximum 16 hours per day"),
    strengths: z.array(z.string().min(1)).max(20).default([]),
    weaknesses: z.array(z.string().min(1)).max(20).default([]),
  })
  .refine((data) => data.strengths.every((id) => !data.weaknesses.includes(id)), {
    message: "A subject cannot be both a strength and a weakness",
    path: ["strengths"],
  });

export const aiGenerateRequestSchema = z.object({
  topicId: z.string().min(1, "topicId is required"),
  query: z.string().trim().min(1, "Ask your mentor a question").max(4000),
  mode: z.enum(PROMPT_MODES, "Unknown response mode"),
});

export const quizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const quizPayloadSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1).max(20),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type AiGenerateInput = z.infer<typeof aiGenerateRequestSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizPayload = z.infer<typeof quizPayloadSchema>;
