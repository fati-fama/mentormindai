import { prisma } from "@/lib/prisma";

export type AvatarCallMode = "TEXT" | "VOICE";

export async function startAvatarCall(userId: string, mode: AvatarCallMode = "TEXT") {
  return prisma.avatarCallSession.create({
    data: { userId, mode, startTime: new Date() },
  });
}

export async function endAvatarCall(sessionId: string, userId: string, summary?: string | null) {
  return prisma.avatarCallSession.updateMany({
    where: { id: sessionId, userId, endTime: null },
    data: { endTime: new Date(), sessionSummary: summary ?? null },
  });
}

export async function getLatestCall(userId: string) {
  return prisma.avatarCallSession.findFirst({
    where: { userId },
    orderBy: { startTime: "desc" },
  });
}
