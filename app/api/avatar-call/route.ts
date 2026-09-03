import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { avatarCallEndSchema, avatarCallStartSchema } from "@/lib/schemas";
import { endAvatarCall, getLatestCall, startAvatarCall } from "@/services/avatarCallService";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const session = await getLatestCall(userId);
    return NextResponse.json({ session });
  } catch (error) {
    console.error("Avatar call GET failed:", error);
    return NextResponse.json(
      { error: "Could not load your avatar call session." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = avatarCallStartSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const session = await startAvatarCall(userId, parsed.data.mode);
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Avatar call start failed:", error);
    return NextResponse.json(
      { error: "Could not start an avatar call right now." },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = avatarCallEndSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const result = await endAvatarCall(parsed.data.sessionId, userId, parsed.data.sessionSummary);
    if (result.count === 0) {
      return NextResponse.json({ error: "Session not found or already ended" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Avatar call end failed:", error);
    return NextResponse.json(
      { error: "Could not end the avatar call right now." },
      { status: 503 },
    );
  }
}
