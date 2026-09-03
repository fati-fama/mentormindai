import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { aiGenerateRequestSchema } from "@/lib/schemas";
import { generatePersonalizedStream } from "@/services/aiService";

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

  if (mode === "quiz") {
    return NextResponse.json(
      { error: "Streaming is not supported for quiz mode. Use POST /api/ai/generate instead." },
      { status: 400 },
    );
  }

  try {
    const { stream, provider } = await generatePersonalizedStream(
      user.id,
      topicId,
      query,
      mode,
      history,
    );

    const encoder = new TextEncoder();
    let firstChunk = true;

    const sseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "provider", provider })}\n\n`),
          );

          const reader = stream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (firstChunk) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`),
              );
              firstChunk = false;
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: value })}\n\n`),
            );
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
          );
          controller.close();
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Stream failed";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`),
          );
          controller.close();
        }
      },
    });

    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Topic not found for this request") {
      return NextResponse.json({ error: "That topic does not exist" }, { status: 404 });
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("AI streaming route failed:", errMsg);

    let category = "AI provider error";
    let httpStatus = 503;

    if (errMsg.includes("No AI provider configured")) {
      category = "Invalid API configuration";
      httpStatus = 500;
    } else if (errMsg.includes("401") || errMsg.toLowerCase().includes("authentication")) {
      category = "AI provider authentication failed";
      httpStatus = 502;
    } else if (errMsg.includes("403")) {
      category = "AI provider access forbidden";
      httpStatus = 502;
    } else if (errMsg.includes("404") || errMsg.toLowerCase().includes("model")) {
      category = "AI model unavailable";
      httpStatus = 502;
    } else if (errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit")) {
      category = "AI rate limit reached";
      httpStatus = 429;
    } else if (errMsg.includes("500") || errMsg.includes("502") || errMsg.includes("503")) {
      category = "AI provider server error";
      httpStatus = 502;
    } else if (errMsg.includes("abort") || errMsg.includes("timeout") || errMsg.includes("ECONNRESET")) {
      category = "Network error";
      httpStatus = 504;
    }

    console.error("AI error category:", category, "| providers attempted | error:", errMsg.slice(0, 300));

    return NextResponse.json(
      { error: category },
      { status: httpStatus },
    );
  }
}
