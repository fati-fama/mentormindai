import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { aiGenerateRequestSchema } from "@/lib/schemas";
import { generatePersonalizedResponse } from "@/services/aiService";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = aiGenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { topicId, query, mode, history } = parsed.data;

  try {
    const result = await generatePersonalizedResponse(user.id, topicId, query, mode, history);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Topic not found for this request") {
      return NextResponse.json({ error: "That topic does not exist" }, { status: 404 });
    }
    console.error("AI generate route failed:", error);
    return NextResponse.json(
      { error: "Your mentor is temporarily unavailable. Please try again in a moment." },
      { status: 503 },
    );
  }
}
