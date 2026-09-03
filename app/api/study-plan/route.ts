import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateStudyPlan, type StudyPlan } from "@/services/studyPlanService";

const cache = new Map<string, { plan: StudyPlan; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const cached = cache.get(user.id);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ plan: cached.plan });
  }

  try {
    const plan = await generateStudyPlan(user.id);
    cache.set(user.id, { plan, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Study plan generation failed:", error);
    return NextResponse.json({ error: "Failed to generate study plan" }, { status: 503 });
  }
}
