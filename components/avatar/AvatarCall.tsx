"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Select } from "@/components/ui";
import { MentorRobot } from "@/components/avatar/MentorRobot";
import { type WhiteRobotMood } from "@/components/robot/WhiteRobot";
import { AvatarMoodIndicator } from "@/components/avatar/AvatarMoodIndicator";
import { CosmicBackground } from "@/components/visual/CosmicBackground";
import { useSpeech } from "@/components/avatar/useSpeech";
import { useAvatarRobotControls } from "@/components/avatar/RobotControls";
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
  const [mood, setMood] = useState<WhiteRobotMood>("HAPPY");
  const [moodScore, setMoodScore] = useState(75);
  const [moodReason, setMoodReason] = useState<string | undefined>();
  const [topicId, setTopicId] = useState<string>(topics[0]?.id ?? "");
  const [mode, setMode] = useState<PromptMode>("explain");
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { supported: speechSupported, speaking, speak, cancel } = useSpeech();
  const robotControls = useAvatarRobotControls(speaking);

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
          robotControls.onCallStarted();
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
          setMood((data.mood as WhiteRobotMood) ?? "NEUTRAL");
          setMoodScore(data.score ?? 75);
          setMoodReason(data.reason);
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
    robotControls.onUserSentMessage();

    try {
      const history = messages.slice(-20).map((m) => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, query: trimmed, mode, history }),
      });
      const data = await res.json();
      const reply = data.content ?? data.error ?? "Thinking...";
      setMessages((prev) => [
        ...prev,
        { id: `m-${Date.now()}`, role: "mentor", content: reply },
      ]);
      robotControls.onAiResponseReceived();
      if (speechEnabled && speechSupported) {
        speak(reply);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `m-${Date.now()}`, role: "mentor", content: "Connection lost. Please try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [query, topicId, mode, isSending, messages, speechEnabled, speechSupported, speak, robotControls]);

  const endCall = useCallback(async () => {
    cancel();
    robotControls.onCallEnding();
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
  }, [sessionId, messages.length, elapsed, router, cancel, robotControls]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-space-950/95 backdrop-blur-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-glass-border px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" />
          <span className="text-sm font-medium text-ink-strong">Avatar Call</span>
          <span className="text-sm text-ink-faint">{formatTime(elapsed)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Select
            label="Topic"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            options={topics.map((t) => ({ value: t.id, label: `${t.subjectName} — ${t.name}` }))}
            className="min-w-[180px]"
          />
          <Select
            label="Mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as PromptMode)}
            options={PROMPT_MODES.map((m) => ({ value: m, label: MODE_LABELS[m] }))}
          />
          <Button variant="danger" size="sm" onClick={endCall}>
            End Call
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Robot stage */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <CosmicBackground className="absolute inset-0 overflow-hidden pointer-events-none" />
          <div className="relative z-10 text-center">
            <div className="mx-auto h-80 w-80">
              <MentorRobot state={robotControls.state} className="h-full w-full" />
            </div>
            <div className="mt-4 mx-auto max-w-xs">
              <AvatarMoodIndicator mood={mood} score={moodScore} reason={moodReason} />
            </div>
            {/* Caption band */}
            {messages.length > 0 && messages[messages.length - 1].role === "mentor" && (
              <div className="mt-4 mx-auto max-w-md rounded-lg border border-glass-border bg-glass/60 px-4 py-2 backdrop-blur-sm">
                <p className="text-sm text-ink line-clamp-3">
                  {messages[messages.length - 1].content}
                </p>
              </div>
            )}
          </div>
          {/* Call controls */}
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (speechEnabled) {
                  cancel();
                }
                setSpeechEnabled(!speechEnabled);
              }}
              title={speechEnabled ? "Mute speech" : "Unmute speech"}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
                speechEnabled
                  ? "border-brand/50 bg-brand/20 text-brand hover:bg-brand/30"
                  : "border-glass-border bg-glass text-ink-faint hover:bg-space-700/50"
              }`}
            >
              {speechEnabled ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
            <button
              type="button"
              disabled
              title="Camera coming soon"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-glass-border bg-glass text-ink-faint opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex w-80 flex-col border-l border-glass-border bg-space-850">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-ink-faint">
                Type a question to start the conversation.
              </p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={msg.role === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-brand text-white"
                      : "bg-space-700/60 text-ink border border-glass-border"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-sm text-ink-faint">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> Thinking...
              </div>
            )}
          </div>

          <div className="border-t border-glass-border p-3">
            <div className="flex gap-2">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your mentor..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-glass-border bg-space-700/60 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
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
