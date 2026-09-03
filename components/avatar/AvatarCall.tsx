"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Robot, type RobotMood } from "@/components/avatar/Robot";
import { PROMPT_MODES, MODE_LABELS, type PromptMode } from "@/prompts/promptTemplates";

type Message = {
  id: string;
  role: "user" | "mentor";
  content: string;
};

type TopicOption = { id: string; name: string; subjectName: string };

export function AvatarCall({ topics }: { topics: TopicOption[] }) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mood, setMood] = useState<RobotMood>("HAPPY");
  const [topicId, setTopicId] = useState<string>(topics[0]?.id ?? "");
  const [mode, setMode] = useState<PromptMode>("explain");
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function start() {
      try {
        const res = await fetch("/api/avatar-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "TEXT" }),
        });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.session.id);
        }
      } catch {
        // Non-blocking; call UI still works without server tracking
      }
    }
    start();
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    async function fetchMood() {
      try {
        const res = await fetch("/api/mood");
        if (res.ok) {
          const data = await res.json();
          setMood((data.mood as RobotMood) ?? "NEUTRAL");
        }
      } catch {
        // non-blocking
      }
    }
    fetchMood();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const sendMessage = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || !topicId || isSending) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: trimmed }]);
    setQuery("");
    setIsSending(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, query: trimmed, mode }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: `m-${Date.now()}`, role: "mentor", content: data.content ?? data.error ?? "Thinking..." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `m-${Date.now()}`, role: "mentor", content: "Connection lost. Please try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [query, topicId, mode, isSending]);

  const endCall = useCallback(async () => {
    if (sessionId) {
      try {
        await fetch("/api/avatar-call", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            sessionSummary: `${messages.length} messages exchanged over ${formatTime(elapsed)}.`,
          }),
        });
      } catch {
        // non-blocking
      }
    }
    router.push("/dashboard/mentor");
  }, [sessionId, messages.length, elapsed, router]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-700 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-medium text-white">Avatar Call</span>
          <span className="text-sm text-slate-400">{formatTime(elapsed)}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-white"
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
            className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-white"
          >
            {PROMPT_MODES.map((m) => (
              <option key={m} value={m}>
                {MODE_LABELS[m]}
              </option>
            ))}
          </select>
          <Button variant="danger" size="sm" onClick={endCall}>
            End Call
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 items-center justify-center bg-slate-800">
          <div className="text-center">
            <div className="mx-auto h-48 w-48">
              <Robot mood={mood} avatarColor="var(--avatar)" className="h-full w-full" />
            </div>
            <p className="mt-4 text-sm text-slate-400">Your AI Mentor</p>
          </div>
        </div>

        <div className="flex w-80 flex-col border-l border-slate-700 bg-slate-850">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-slate-500">
                Type a question to start the conversation.
              </p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={msg.role === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-[var(--brand)] text-white"
                      : "bg-slate-700 text-slate-200"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="text-sm text-slate-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand)]" /> Thinking...
              </div>
            )}
          </div>

          <div className="border-t border-slate-700 p-3">
            <div className="flex gap-2">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your mentor..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[var(--brand)] focus:outline-none"
              />
              <Button size="sm" onClick={sendMessage} isLoading={isSending} disabled={!query.trim()}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
