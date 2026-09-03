import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAvailableProviders } from "@/services/aiService";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const providers = getAvailableProviders();
  const userPref = await prisma.user.findUnique({
    where: { id: user.id },
    select: { preferredAiProvider: true },
  });

  const configuredCount = providers.filter((p) => p.configured).length;

  return NextResponse.json({
    providers,
    preferred: userPref?.preferredAiProvider ?? "AUTO",
    configuredCount,
    hasAnyProvider: configuredCount > 0,
  });
}
