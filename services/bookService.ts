import { prisma } from "@/lib/prisma";

export type BookInput = {
  title: string;
  author?: string | null;
  edition?: string | null;
  subjectId?: string | null;
  fileUrl?: string | null;
};

export async function listBooks(userId: string) {
  return prisma.book.findMany({
    where: { userId },
    orderBy: [{ subjectId: "asc" }, { createdAt: "desc" }],
    include: { subject: { select: { id: true, name: true } } },
  });
}

export async function getBook(userId: string, id: string) {
  return prisma.book.findFirst({
    where: { userId, id },
    include: { subject: { select: { id: true, name: true } } },
  });
}

export async function createBook(userId: string, input: BookInput) {
  return prisma.book.create({
    data: {
      userId,
      title: input.title.trim(),
      author: input.author?.trim() || null,
      edition: input.edition?.trim() || null,
      subjectId: input.subjectId || null,
      fileUrl: input.fileUrl || null,
      isPrimaryReference: false,
    },
  });
}

export async function updateBook(userId: string, id: string, input: Partial<BookInput>) {
  return prisma.book.updateMany({
    where: { userId, id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.author !== undefined ? { author: input.author?.trim() || null } : {}),
      ...(input.edition !== undefined ? { edition: input.edition?.trim() || null } : {}),
      ...(input.subjectId !== undefined ? { subjectId: input.subjectId || null } : {}),
      ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl || null } : {}),
    },
  });
}

export async function deleteBook(userId: string, id: string) {
  return prisma.book.deleteMany({ where: { userId, id } });
}

export async function getPrimaryReference(userId: string, subjectId: string) {
  return prisma.book.findFirst({
    where: { userId, subjectId, isPrimaryReference: true },
  });
}

export async function setPrimaryReference(userId: string, bookId: string) {
  const book = await prisma.book.findFirst({
    where: { userId, id: bookId },
    select: { subjectId: true },
  });
  if (!book) return null;

  return prisma.$transaction(async (tx) => {
    if (book.subjectId) {
      await tx.book.updateMany({
        where: { userId, subjectId: book.subjectId, isPrimaryReference: true },
        data: { isPrimaryReference: false },
      });
    }
    return tx.book.update({
      where: { id: bookId },
      data: { isPrimaryReference: true },
    });
  });
}
