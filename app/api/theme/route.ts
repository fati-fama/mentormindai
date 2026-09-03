import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { themeSchema } from "@/lib/schemas";
import { getTheme, resetTheme, saveTheme } from "@/services/themeService";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const theme = await getTheme(userId);
    return NextResponse.json({ theme });
  } catch (error) {
    console.error("Theme GET failed:", error);
    return NextResponse.json(
      { error: "Could not load your theme right now." },
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

  const parsed = themeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const result = await saveTheme(userId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Theme save failed:", error);
    return NextResponse.json(
      { error: "Could not save your theme right now." },
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
    const theme = await resetTheme(userId);
    return NextResponse.json({ theme });
  } catch (error) {
    console.error("Theme reset failed:", error);
    return NextResponse.json(
      { error: "Could not reset your theme right now." },
      { status: 503 },
    );
  }
}
