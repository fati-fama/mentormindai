import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProviderSchema = z.object({
  provider: z.enum(["AUTO", "OPENAI", "GROQ", "GEMINI"]),
});

export async function PUT(request: Request) {
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

  const parsed = updateProviderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { preferredAiProvider: parsed.data.provider },
  });

  return NextResponse.json({ preferred: parsed.data.provider });
}
