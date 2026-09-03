"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui";

type Book = {
  id: string;
  title: string;
  author: string | null;
  edition: string | null;
  subjectId: string | null;
  fileUrl: string | null;
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

  const resetForm = () => {
    setForm({ title: "", author: "", edition: "", subjectId: "" });
    setShowForm(false);
    setEditingId(null);
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
          }
        }
        resetForm();
      } finally {
        setSaving(false);
      }
    },
    [form, editingId],
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
          <h1 className="text-xl font-bold text-slate-900">Book Library</h1>
          <p className="mt-1 text-sm text-slate-600">
            Add the books you study from. Mark one per subject as your Primary Reference so your
            mentor mirrors its terminology.
          </p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          Add book
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[var(--brand)] focus:outline-2 focus:outline-[var(--brand)] focus:-outline-offset-1"
                placeholder="e.g. Fundamentals of Physics"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Author</label>
              <input
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[var(--brand)] focus:outline-2 focus:outline-[var(--brand)] focus:-outline-offset-1"
                placeholder="e.g. Halliday, Resnick"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Edition</label>
              <input
                value={form.edition}
                onChange={(e) => setForm((f) => ({ ...f, edition: e.target.value }))}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[var(--brand)] focus:outline-2 focus:outline-[var(--brand)] focus:-outline-offset-1"
                placeholder="e.g. 11th Edition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Subject</label>
              <select
                value={form.subjectId}
                onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[var(--brand)] focus:outline-2 focus:outline-[var(--brand)] focus:-outline-offset-1"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm" isLoading={saving}>
              {editingId ? "Update" : "Add"}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {books.length === 0 && !showForm ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-600">
            No books in your library yet. Add the books you&apos;re studying from so your mentor
            can tailor explanations to your syllabus.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([groupName, groupBooks]) => (
            <div key={groupName}>
              <h2 className="text-sm font-semibold text-slate-900">{groupName}</h2>
              <ul className="mt-2 space-y-2">
                {groupBooks.map((book) => (
                  <li key={book.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{book.title}</p>
                        {book.isPrimaryReference && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {[book.author, book.edition].filter(Boolean).join(" · ") || "No author listed"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
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
