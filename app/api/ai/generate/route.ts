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

    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[AI] Route error:", errMsg.slice(0, 500));

    let category = "AI provider error";
    let httpStatus = 503;

    if (errMsg.includes("No AI provider configured")) {
      category = "Invalid API configuration";
      httpStatus = 500;
    } else if (errMsg.includes("401") || errMsg.toLowerCase().includes("invalid api key") || errMsg.toLowerCase().includes("incorrect api key")) {
      category = "AI provider authentication failed";
      httpStatus = 502;
    } else if (errMsg.includes("403")) {
      category = "AI provider access forbidden";
      httpStatus = 502;
    } else if (errMsg.includes("insufficient_quota") || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("credits") || errMsg.toLowerCase().includes("billing")) {
      category = "AI provider quota exceeded — please check billing";
      httpStatus = 402;
    } else if (errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit")) {
      category = "AI rate limit reached — please wait and retry";
      httpStatus = 429;
    } else if (errMsg.toLowerCase().includes("model")) {
      category = "AI model unavailable";
      httpStatus = 502;
    } else if (errMsg.includes("500") || errMsg.includes("502") || errMsg.includes("503")) {
      category = "AI provider server error";
      httpStatus = 502;
    } else if (errMsg.includes("abort") || errMsg.includes("timeout") || errMsg.includes("ECONNRESET")) {
      category = "Network error";
      httpStatus = 504;
    }

    console.error("[AI] Categorized as:", category);

    return NextResponse.json(
      { error: category },
      { status: httpStatus },
    );
  }
}
