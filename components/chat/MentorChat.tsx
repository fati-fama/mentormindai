"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { PROMPT_MODES, MODE_LABELS, type PromptMode } from "@/prompts/promptTemplates";
import { Robot } from "@/components/avatar/Robot";

type Message = {
  id: string;
  role: "user" | "mentor";
  content: string;
  mode: PromptMode;
  isFallback?: boolean;
};

type TopicOption = { id: string; name: string; subjectName: string };

function classNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function MentorChat({ topics }: { topics: TopicOption[] }) {
  const [topicId, setTopicId] = useState<string>(topics[0]?.id ?? "");
  const [mode, setMode] = useState<PromptMode>("explain");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || !topicId || isSending) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      mode,
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsSending(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, query: trimmed, mode }),
      });
      const data = await res.json();

      const mentorMsg: Message = {
        id: `m-${Date.now()}`,
        role: "mentor",
        content: data.content ?? data.error ?? "Your mentor is thinking...",
        mode,
        isFallback: data.usedFallback ?? false,
      };
      setMessages((prev) => [...prev, mentorMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: "mentor",
          content: "Connection lost. Please try again.",
          mode,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [query, topicId, mode, isSending]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Robot mood="HAPPY" className="h-8 w-8" />
          <span className="text-sm font-semibold text-slate-900">AI Mentor</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-[var(--brand)] focus:outline-2 focus:outline-[var(--brand)] focus:-outline-offset-1"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.subjectName} — {t.name}
              </option>
            ))}
          </select>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as PromptMode)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-[var(--brand)] focus:outline-2 focus:outline-[var(--brand)] focus:-outline-offset-1"
          >
            {PROMPT_MODES.map((m) => (
              <option key={m} value={m}>
                {MODE_LABELS[m]}
              </option>
            ))}
          </select>
          <Link
            href="/dashboard/avatar-call"
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Avatar Call
          </Link>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Robot mood="HAPPY" className="mx-auto h-20 w-20" />
              <p className="mt-3 text-sm text-slate-600">
                Pick a topic and mode, then ask your mentor anything.
              </p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={classNames(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={classNames(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                msg.role === "user"
                  ? "bg-[var(--brand)] text-white"
                  : "border border-slate-200 bg-white text-slate-800",
              )}
            >
              {msg.role === "mentor" && (
                <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--brand)" }}>
                  {MODE_LABELS[msg.mode]}
                  {msg.isFallback && " · fallback"}
                </p>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand)]" />
                Your mentor is thinking...
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 pt-3">
        <div className="flex gap-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your mentor a question..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-2 focus:outline-[var(--brand)] focus:-outline-offset-1"
          />
          <Button onClick={sendMessage} isLoading={isSending} disabled={!query.trim() || !topicId}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
