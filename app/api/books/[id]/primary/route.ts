import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { setPrimaryReference } from "@/services/bookService";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const book = await setPrimaryReference(userId, id);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    return NextResponse.json({ book });
  } catch (error) {
    console.error("Set primary reference failed:", error);
    return NextResponse.json(
      { error: "Could not set primary reference right now." },
      { status: 503 },
    );
  }
}
