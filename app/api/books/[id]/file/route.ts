import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { getBook, updateBook } from "@/services/bookService";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join, extname } from "path";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_EXTENSIONS = new Set([".pdf", ".epub", ".txt"]);
const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/epub+zip",
  "text/plain",
]);
const MAX_SIZE = 20 * 1024 * 1024;

function uploadRoot(): string {
  return join(process.cwd(), process.env.BOOK_UPLOAD_DIR || ".uploads");
}

export async function POST(request: Request, { params }: Params) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const book = await getBook(userId, id);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File exceeds 20 MB limit" },
      { status: 413 },
    );
  }

  const ext = extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: "Only .pdf, .epub, and .txt files are accepted" },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIMES.has(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed" },
      { status: 400 },
    );
  }

  const root = uploadRoot();
  const userDir = join(root, "books", userId);
  await mkdir(userDir, { recursive: true });

  const storedName = `${id}${ext}`;
  const absPath = join(userDir, storedName);
  const relativePath = join("books", userId, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buffer);

  await updateBook(userId, id, {
    filePath: relativePath,
    fileMime: file.type,
    fileSize: file.size,
  });

  return NextResponse.json({
    filePath: relativePath,
    fileMime: file.type,
    fileSize: file.size,
  });
}

export async function GET(_request: Request, { params }: Params) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const book = await getBook(userId, id);
  if (!book || !book.filePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const absPath = join(uploadRoot(), book.filePath);

  let fileBuffer: Buffer;
  try {
    const { readFile } = await import("fs/promises");
    fileBuffer = await readFile(absPath);
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", book.fileMime || "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename="${book.title}${extname(book.filePath)}"`);
  headers.set("Content-Length", String(fileBuffer.byteLength));

  return new NextResponse(new Uint8Array(fileBuffer), { headers });
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const book = await getBook(userId, id);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (book.filePath) {
    const absPath = join(uploadRoot(), book.filePath);
    await unlink(absPath).catch(() => {});
  }

  await updateBook(userId, id, {
    filePath: null,
    fileMime: null,
    fileSize: null,
  });

  return NextResponse.json({ success: true });
}
