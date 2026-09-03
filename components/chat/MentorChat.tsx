"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Select } from "@/components/ui";
import { Badge } from "@/components/ui/Badge";
import { PROMPT_MODES, MODE_LABELS, type PromptMode } from "@/prompts/promptTemplates";
import { WhiteRobot, WhiteRobotFace } from "@/components/robot/WhiteRobot";
import { SendIcon } from "@/components/ui/icons";
import type { QuizPayload, QuizQuestion } from "@/lib/schemas";

type Message = {
  id: string;
  role: "user" | "mentor";
  content: string;
  mode: PromptMode;
  isFallback?: boolean;
  isStreaming?: boolean;
  provider?: string;
  quiz?: QuizPayload | null;
  quizResult?: { correctCount: number; totalQuestions: number; score: number; masteryLevel: number };
};

type TopicOption = { id: string; name: string; subjectName: string };

function QuizPlayer({
  quiz,
  topicId,
  onComplete,
}: {
  quiz: QuizPayload;
  topicId: string;
  onComplete: (result: { correctCount: number; totalQuestions: number; score: number; masteryLevel: number }) => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const question: QuizQuestion = quiz.questions[currentQ];
  const isLast = currentQ === quiz.questions.length - 1;

  const handleNext = useCallback(async () => {
    if (selected === null) return;

    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setShowExplanation(true);

    if (isLast) {
      setSubmitting(true);
      try {
        const res = await fetch("/api/quiz-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId,
            questions: quiz.questions,
            answers: newAnswers.map((sel, idx) => ({ questionIndex: idx, selectedIndex: sel })),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setDone(true);
          onComplete(data);
        }
      } finally {
        setSubmitting(false);
      }
    }
  }, [selected, answers, isLast, topicId, quiz.questions, onComplete]);

  const handleContinue = () => {
    setShowExplanation(false);
    setSelected(null);
    setCurrentQ((q) => q + 1);
  };

  if (done) return null;

  const difficultyTone = question.difficulty === "easy" ? "success" : question.difficulty === "medium" ? "warning" : "danger";

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-faint">
          Question {currentQ + 1} of {quiz.questions.length}
        </span>
        <Badge tone={difficultyTone as "success" | "warning" | "danger"}>
          {question.difficulty}
        </Badge>
      </div>

      <p className="text-sm font-medium text-ink-strong">{question.question}</p>

      <div className="space-y-2">
        {question.options.map((option, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === question.correctIndex;
          const showResult = showExplanation;

          let optionClass =
            "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ";
          if (showResult && isCorrect) {
            optionClass += "border-success/40 bg-success/10 text-success";
          } else if (showResult && isSelected && !isCorrect) {
            optionClass += "border-danger/40 bg-danger/10 text-danger";
          } else if (isSelected) {
            optionClass += "border-brand bg-brand/10 text-ink-strong";
          } else {
            optionClass +=
              "border-glass-border bg-space-700/40 text-ink hover:border-glass-border-hover hover:bg-space-700/60";
          }

          return (
            <button
              key={idx}
              onClick={() => !showExplanation && setSelected(idx)}
              disabled={showExplanation}
              className={optionClass}
            >
              <span className="mr-2 font-medium">{String.fromCharCode(65 + idx)}.</span>
              {option}
              {showResult && isCorrect && " \u2713"}
              {showResult && isSelected && !isCorrect && " \u2717"}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className="rounded-lg bg-space-700/50 p-3 text-sm text-ink-muted">
          <p className="font-medium text-ink-strong">Explanation</p>
          <p className="mt-1">{question.explanation}</p>
        </div>
      )}

      <div className="flex justify-end">
        {!showExplanation ? (
          <Button size="sm" onClick={handleNext} disabled={selected === null || submitting} isLoading={submitting}>
            {isLast ? "Submit quiz" : "Check answer"}
          </Button>
        ) : !isLast ? (
          <Button size="sm" onClick={handleContinue}>
            Next question →
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function QuizResultSummary({
  result,
}: {
  result: { correctCount: number; totalQuestions: number; score: number; masteryLevel: number };
}) {
  const percentage = Math.round(result.score);
  const isGood = percentage >= 70;

  return (
    <div
      className={`mt-3 rounded-lg border p-3 ${
        isGood
          ? "border-success/30 bg-success/10"
          : "border-warning/30 bg-warning/10"
      }`}
    >
      <p className="text-sm font-semibold text-ink-strong">
        Quiz complete — {result.correctCount}/{result.totalQuestions} correct ({percentage}%)
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Topic mastery updated to {Math.round(result.masteryLevel)}%.
        {isGood
          ? " Great work — keep this momentum going!"
          : " Your mentor will focus more on this topic next time."}
      </p>
    </div>
  );
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

  const buildHistory = useCallback(
    (): Array<{ role: "user" | "assistant"; content: string }> => {
      const history: Array<{ role: "user" | "assistant"; content: string }> = [];
      for (const msg of messages.slice(-20)) {
        if (msg.quiz) continue;
        history.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
      return history;
    },
    [messages],
  );

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

    const history = buildHistory();

    if (mode === "quiz") {
      try {
        const res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, query: trimmed, mode, history }),
        });
        const data = await res.json();

        const mentorMsg: Message = {
          id: `m-${Date.now()}`,
          role: "mentor",
          content: data.content ?? data.error ?? "Your mentor is thinking...",
          mode,
          isFallback: data.usedFallback ?? false,
          provider: data.provider,
          quiz: data.quiz ?? null,
        };
        setMessages((prev) => [...prev, mentorMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: `m-${Date.now()}`, role: "mentor", content: "Connection lost. Please try again.", mode },
        ]);
      } finally {
        setIsSending(false);
      }
      return;
    }

    const mentorMsgId = `m-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: mentorMsgId, role: "mentor", content: "", mode, isStreaming: true },
    ]);

    try {
      const res = await fetch("/api/ai/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, query: trimmed, mode, history }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: "Stream unavailable" }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === mentorMsgId
              ? { ...m, content: data.error ?? "Your mentor is temporarily unavailable.", isStreaming: false }
              : m,
          ),
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let providerName = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as {
              type: string;
              content?: string;
              provider?: string;
              error?: string;
            };

            if (event.type === "provider" && event.provider) {
              providerName = event.provider;
            } else if (event.type === "chunk" && event.content) {
              accumulated += event.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === mentorMsgId ? { ...m, content: accumulated, provider: providerName } : m,
                ),
              );
            } else if (event.type === "error" && event.error) {
              accumulated += `\n\n[Error: ${event.error}]`;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === mentorMsgId ? { ...m, content: accumulated, isStreaming: false } : m,
                ),
              );
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === mentorMsgId
            ? { ...m, content: accumulated || "No response received.", isStreaming: false, provider: providerName }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === mentorMsgId
            ? { ...m, content: "Connection lost. Please try again.", isStreaming: false }
            : m,
        ),
      );
    } finally {
      setIsSending(false);
    }
  }, [query, topicId, mode, isSending, buildHistory]);

  const handleQuizComplete = useCallback(
    (msgId: string) => (result: { correctCount: number; totalQuestions: number; score: number; masteryLevel: number }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, quizResult: result } : m,
        ),
      );
    },
    [],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-glass-border pb-3">
        <div className="flex items-center gap-2">
          <WhiteRobotFace mood="HAPPY" className="h-8 w-8" />
          <span className="text-sm font-semibold text-ink-strong">AI Mentor</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select
            label="Topic"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            options={topics.map((t) => ({ value: t.id, label: `${t.subjectName} — ${t.name}` }))}
            className="min-w-[200px]"
          />
          <Select
            label="Mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as PromptMode)}
            options={PROMPT_MODES.map((m) => ({ value: m, label: MODE_LABELS[m] }))}
          />
          <Link
            href="/dashboard/avatar-call"
            className="rounded-lg border border-glass-border bg-glass px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:border-glass-border-hover hover:text-ink-strong"
          >
            Avatar Call
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-32 w-32">
                <WhiteRobot mood="HAPPY" className="mx-auto h-20 w-20" />
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                Pick a topic and mode, then ask your mentor anything.
              </p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "mentor" && (
              <div className="mr-2 mt-1 shrink-0">
                <WhiteRobotFace mood="NEUTRAL" className="h-7 w-7" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand text-white shadow-[var(--glow-brand)]"
                  : "border border-glass-border bg-glass text-ink backdrop-blur-[var(--glass-blur)]"
              }`}
            >
              {msg.role === "mentor" && (
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand">
                  {MODE_LABELS[msg.mode]}
                  {msg.provider && <span className="ml-1.5 normal-case text-ink-faint">via {msg.provider}</span>}
                  {msg.isFallback && " · fallback"}
                </p>
              )}
              {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
              {msg.isStreaming && (
                <span className="inline-block h-4 w-0.5 animate-pulse bg-brand align-middle" />
              )}
              {msg.quiz && (
                <QuizPlayer
                  quiz={msg.quiz}
                  topicId={topicId}
                  onComplete={handleQuizComplete(msg.id)}
                />
              )}
              {msg.quizResult && <QuizResultSummary result={msg.quizResult} />}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-glass-border bg-glass px-4 py-3 backdrop-blur-[var(--glass-blur)]">
              <div className="flex items-center gap-2 text-sm text-ink-faint">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
                Your mentor is thinking...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-glass-border pt-3">
        <div className="flex gap-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your mentor a question..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-glass-border bg-space-700/60 px-4 py-2.5 text-sm text-ink shadow-sm placeholder:text-ink-faint focus:border-brand focus:outline-2 focus:outline-brand focus:-outline-offset-1"
          />
          <Button onClick={sendMessage} isLoading={isSending} disabled={!query.trim() || !topicId}>
            <SendIcon size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
