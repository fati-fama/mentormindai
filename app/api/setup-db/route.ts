import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SETUP_TOKEN = "mentormind-setup-2026";

const sqlStatements = [
  // Enums
  `DO $$ BEGIN
    CREATE TYPE "MistakeType" AS ENUM ('CONCEPTUAL','CALCULATION','FORMULA_RECALL','MISREAD_QUESTION','PROCEDURAL','CARELESS','GUESSING','OTHER');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    CREATE TYPE "VectorStatus" AS ENUM ('PENDING','PROCESSING','COMPLETED','FAILED');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    CREATE TYPE "ThemeLayout" AS ENUM ('FOCUS','CLASSIC','COMPACT');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    CREATE TYPE "AvatarMood" AS ENUM ('HAPPY','NEUTRAL','SAD');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    CREATE TYPE "AvatarCallMode" AS ENUM ('TEXT','VOICE');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    CREATE TYPE "AiProvider" AS ENUM ('AUTO','OPENAI','GROQ','GEMINI');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,

  // Users table
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "educationLevel" TEXT,
    "targetExam" TEXT,
    "examDate" TIMESTAMP(3),
    "targetScore" TEXT,
    "dailyStudyMinutes" INTEGER,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "preferredAiProvider" "AiProvider" NOT NULL DEFAULT 'AUTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")`,
  `CREATE INDEX IF NOT EXISTS "users_targetExam_idx" ON "users"("targetExam")`,

  // Subjects table
  `CREATE TABLE IF NOT EXISTS "subjects" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "subjects_name_key" ON "subjects"("name")`,

  // Topics table
  `CREATE TABLE IF NOT EXISTS "topics" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "topics_subjectId_name_key" ON "topics"("subjectId","name")`,
  `CREATE INDEX IF NOT EXISTS "topics_subjectId_idx" ON "topics"("subjectId")`,

  // UserTopicProgress table
  `CREATE TABLE IF NOT EXISTS "user_topic_progress" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "masteryLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_topic_progress_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "user_topic_progress_userId_topicId_key" ON "user_topic_progress"("userId","topicId")`,
  `CREATE INDEX IF NOT EXISTS "user_topic_progress_userId_idx" ON "user_topic_progress"("userId")`,
  `CREATE INDEX IF NOT EXISTS "user_topic_progress_topicId_idx" ON "user_topic_progress"("topicId")`,

  // QuizAttempts table
  `CREATE TABLE IF NOT EXISTS "quiz_attempts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "durationSeconds" INTEGER,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "quiz_attempts_userId_createdAt_idx" ON "quiz_attempts"("userId","createdAt")`,
  `CREATE INDEX IF NOT EXISTS "quiz_attempts_topicId_idx" ON "quiz_attempts"("topicId")`,

  // Mistakes table
  `CREATE TABLE IF NOT EXISTS "mistakes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "topicId" TEXT,
    "question" TEXT NOT NULL,
    "studentAnswer" TEXT NOT NULL,
    "correctAnswer" TEXT,
    "mistakeType" "MistakeType" NOT NULL DEFAULT 'OTHER',
    "explanation" TEXT,
    "repetitionCount" INTEGER NOT NULL DEFAULT 1,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "lastOccurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mistakes_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "mistakes_userId_resolved_idx" ON "mistakes"("userId","resolved")`,
  `CREATE INDEX IF NOT EXISTS "mistakes_userId_repetitionCount_idx" ON "mistakes"("userId","repetitionCount")`,
  `CREATE INDEX IF NOT EXISTS "mistakes_topicId_idx" ON "mistakes"("topicId")`,

  // Books table
  `CREATE TABLE IF NOT EXISTS "books" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "subjectId" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "edition" TEXT,
    "fileUrl" TEXT,
    "filePath" TEXT,
    "fileMime" TEXT,
    "fileSize" INTEGER,
    "isPrimaryReference" BOOLEAN NOT NULL DEFAULT false,
    "vectorStatus" "VectorStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "books_userId_subjectId_idx" ON "books"("userId","subjectId")`,
  `CREATE INDEX IF NOT EXISTS "books_userId_isPrimaryReference_idx" ON "books"("userId","isPrimaryReference")`,
  `CREATE INDEX IF NOT EXISTS "books_vectorStatus_idx" ON "books"("vectorStatus")`,

  // AvatarMoodStates table
  `CREATE TABLE IF NOT EXISTS "avatar_mood_states" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "currentMood" "AvatarMood" NOT NULL DEFAULT 'NEUTRAL',
    "moodScore" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "moodReason" TEXT NOT NULL DEFAULT 'Your mentor is ready to help you learn.',
    "factors" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "avatar_mood_states_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "avatar_mood_states_userId_key" ON "avatar_mood_states"("userId")`,

  // ThemePreferences table
  `CREATE TABLE IF NOT EXISTS "theme_preferences" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "layout" "ThemeLayout" NOT NULL DEFAULT 'FOCUS',
    "primaryColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "secondaryColor" TEXT NOT NULL DEFAULT '#10B981',
    "blendedPalette" TEXT,
    "avatarColor" TEXT NOT NULL DEFAULT '#7C3AED',
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "theme_preferences_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "theme_preferences_userId_key" ON "theme_preferences"("userId")`,

  // AvatarCallSessions table
  `CREATE TABLE IF NOT EXISTS "avatar_call_sessions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "mode" "AvatarCallMode" NOT NULL DEFAULT 'TEXT',
    "sessionSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "avatar_call_sessions_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "avatar_call_sessions_userId_startTime_idx" ON "avatar_call_sessions"("userId","startTime")`,

  // Foreign keys
  `DO $$ BEGIN
    ALTER TABLE "topics" ADD CONSTRAINT "topics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "user_topic_progress" ADD CONSTRAINT "user_topic_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "user_topic_progress" ADD CONSTRAINT "user_topic_progress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "mistakes" ADD CONSTRAINT "mistakes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "mistakes" ADD CONSTRAINT "mistakes_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "books" ADD CONSTRAINT "books_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "books" ADD CONSTRAINT "books_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "avatar_mood_states" ADD CONSTRAINT "avatar_mood_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "theme_preferences" ADD CONSTRAINT "theme_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "avatar_call_sessions" ADD CONSTRAINT "avatar_call_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
];

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-setup-token");
  if (token !== SETUP_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];
  try {
    for (let i = 0; i < sqlStatements.length; i++) {
      try {
        await prisma.$executeRawUnsafe(sqlStatements[i]);
        results.push(`OK [${i}]`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push(`SKIP [${i}]: ${msg.slice(0, 100)}`);
      }
    }
    return NextResponse.json({ success: true, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg, results }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Send a POST request with x-setup-token header to initialize the database.",
  });
}
