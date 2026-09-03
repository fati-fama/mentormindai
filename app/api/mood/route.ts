import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { getCurrentMood, recalculateMood } from "@/services/moodService";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const mood = await getCurrentMood(userId);
    return NextResponse.json(mood);
  } catch (error) {
    console.error("Mood GET failed:", error);
    return NextResponse.json(
      { error: "Could not load your mentor mood right now." },
      { status: 503 },
    );
  }
}

export async function POST() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const mood = await recalculateMood(userId);
    return NextResponse.json(mood);
  } catch (error) {
    console.error("Mood recalculation failed:", error);
    return NextResponse.json(
      { error: "Could not recalculate your mentor mood right now." },
      { status: 503 },
    );
  }
}
