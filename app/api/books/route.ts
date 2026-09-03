import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { bookSchema } from "@/lib/schemas";
import { createBook, listBooks } from "@/services/bookService";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const books = await listBooks(userId);
    return NextResponse.json({ books });
  } catch (error) {
    console.error("Books list failed:", error);
    return NextResponse.json(
      { error: "Could not load your book library right now." },
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

  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const book = await createBook(userId, parsed.data);
    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    console.error("Book create failed:", error);
    return NextResponse.json(
      { error: "Could not add this book right now." },
      { status: 503 },
    );
  }
}
