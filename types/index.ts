export type { PromptMode, PromptContext, RecentMistake } from "@/prompts/promptTemplates";
export type {
  RegisterInput,
  LoginInput,
  OnboardingInput,
  AiGenerateInput,
  QuizQuestion,
  QuizPayload,
} from "@/lib/schemas";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  onboardingCompleted: boolean;
}

export interface SubjectOption {
  id: string;
  name: string;
  topicCount: number;
}

export type SubjectAssessment = "STRENGTH" | "WEAKNESS";

export interface TopicProgressSummary {
  topicId: string;
  topicName: string;
  subjectName: string;
  masteryLevel: number;
  accuracy: number | null;
  attemptCount: number;
}
