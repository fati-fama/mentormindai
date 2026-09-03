"use client";

import { useState, useCallback, useRef } from "react";
import { Button, Input, Select } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BooksIcon } from "@/components/ui/icons";

type Book = {
  id: string;
  title: string;
  author: string | null;
  edition: string | null;
  subjectId: string | null;
  fileUrl: string | null;
  filePath: string | null;
  fileMime: string | null;
  fileSize: number | null;
  isPrimaryReference: boolean;
  subject: { id: string; name: string } | null;
};

type SubjectOption = { id: string; name: string };

type Props = {
  initialBooks: Book[];
  subjects: SubjectOption[];
};

export function BookLibrary({ initialBooks, subjects }: Props) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", author: "", edition: "", subjectId: "" });
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setForm({ title: "", author: "", edition: "", subjectId: "" });
    setShowForm(false);
    setEditingId(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.title.trim()) return;
      setSaving(true);
      try {
        if (editingId) {
          const res = await fetch(`/api/books/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: form.title,
              author: form.author || null,
              edition: form.edition || null,
              subjectId: form.subjectId || null,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setBooks((prev) => prev.map((b) => (b.id === editingId ? data.book : b)));
          }
        } else {
          const res = await fetch("/api/books", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: form.title,
              author: form.author || null,
              edition: form.edition || null,
              subjectId: form.subjectId || null,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setBooks((prev) => [...prev, data.book]);
            if (file) {
              const formData = new FormData();
              formData.set("file", file);
              const uploadRes = await fetch(`/api/books/${data.book.id}/file`, {
                method: "POST",
                body: formData,
              });
              if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                setBooks((prev) =>
                  prev.map((b) =>
                    b.id === data.book.id
                      ? { ...b, filePath: uploadData.filePath, fileMime: uploadData.fileMime, fileSize: uploadData.fileSize }
                      : b,
                  ),
                );
              }
            }
          }
        }
        resetForm();
      } finally {
        setSaving(false);
      }
    },
    [form, editingId, file],
  );

  const startEdit = (book: Book) => {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author ?? "",
      edition: book.edition ?? "",
      subjectId: book.subjectId ?? "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this book from your library?")) return;
    const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBooks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const setPrimary = async (id: string) => {
    const res = await fetch(`/api/books/${id}/primary`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setBooks((prev) =>
        prev.map((b) =>
          b.id === updated.book.id
            ? { ...b, isPrimaryReference: true }
            : b.subjectId === updated.book.subjectId
              ? { ...b, isPrimaryReference: false }
              : b,
        ),
      );
    }
  };

  const grouped = books.reduce<Record<string, Book[]>>((acc, book) => {
    const key = book.subject?.name ?? "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(book);
    return acc;
  }, {});

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-strong">Book Library</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Add the books you study from. Mark one per subject as your Primary Reference so your
            mentor mirrors its terminology.
          </p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          + Upload Book
        </Button>
      </div>

      {showForm && (
        <Card variant="glass" className="mt-4 p-5">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Title"
                name="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Fundamentals of Physics"
                required
              />
              <Input
                label="Author"
                name="author"
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                placeholder="e.g. Halliday, Resnick"
              />
              <Input
                label="Edition"
                name="edition"
                value={form.edition}
                onChange={(e) => setForm((f) => ({ ...f, edition: e.target.value }))}
                placeholder="e.g. 11th Edition"
              />
              <Select
                label="Subject"
                name="subjectId"
                value={form.subjectId}
                onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
                options={[
                  { value: "", label: "Select subject" },
                  ...subjects.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-ink-muted">
                Book file (PDF, EPUB, or TXT — max 20 MB)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.epub,.txt"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand/15 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand hover:file:bg-brand/25"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="submit" size="sm" isLoading={saving}>
                {editingId ? "Update" : "Add"}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {books.length === 0 && !showForm ? (
        <Card variant="glass" className="mt-8 p-12 text-center">
          <BooksIcon size={40} className="mx-auto text-ink-faint" />
          <p className="mt-3 text-sm text-ink-muted">
            No books in your library yet. Add the books you&apos;re studying from so your mentor
            can tailor explanations to your syllabus.
          </p>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([groupName, groupBooks]) => (
            <div key={groupName}>
              <h2 className="text-sm font-semibold text-ink-strong">{groupName}</h2>
              <ul className="mt-2 space-y-2">
                {groupBooks.map((book) => (
                  <li key={book.id}>
                    <Card variant="glass" className="flex items-start gap-3 p-4">
                      {/* Gradient spine */}
                      <div
                        className="h-12 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--grad-brand)" }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-ink-strong">{book.title}</p>
                          {book.isPrimaryReference && (
                            <Badge tone="success">Primary</Badge>
                          )}
                          {book.filePath && book.fileSize && (
                            <Badge tone="brand">
                              File attached ({(book.fileSize / 1024).toFixed(0)} KB)
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-ink-faint">
                          {[book.author, book.edition].filter(Boolean).join(" · ") || "No author listed"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {book.filePath && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const a = document.createElement("a");
                                a.href = `/api/books/${book.id}/file`;
                                a.download = "";
                                a.click();
                              }}
                            >
                              Download
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const res = await fetch(`/api/books/${book.id}/file`, { method: "DELETE" });
                                if (res.ok) {
                                  setBooks((prev) =>
                                    prev.map((b) =>
                                      b.id === book.id
                                        ? { ...b, filePath: null, fileMime: null, fileSize: null }
                                        : b,
                                    ),
                                  );
                                }
                              }}
                            >
                              Remove file
                            </Button>
                          </>
                        )}
                        {!book.isPrimaryReference && book.subjectId && (
                          <Button variant="ghost" size="sm" onClick={() => setPrimary(book.id)}>
                            Set Primary
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => startEdit(book)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(book.id)}>
                          Remove
                        </Button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
