import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { bookSchema } from "@/lib/schemas";
import { deleteBook, getBook, updateBook } from "@/services/bookService";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const book = await getBook(userId, id);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    return NextResponse.json({ book });
  } catch (error) {
    console.error("Book get failed:", error);
    return NextResponse.json(
      { error: "Could not load this book right now." },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bookSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const existing = await getBook(userId, id);
    if (!existing) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const result = await updateBook(userId, id, parsed.data);
    if (result.count === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const updated = await getBook(userId, id);
    return NextResponse.json({ book: updated });
  } catch (error) {
    console.error("Book update failed:", error);
    return NextResponse.json(
      { error: "Could not update this book right now." },
      { status: 503 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await deleteBook(userId, id);
    if (result.count === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Book delete failed:", error);
    return NextResponse.json(
      { error: "Could not remove this book right now." },
      { status: 503 },
    );
  }
}
