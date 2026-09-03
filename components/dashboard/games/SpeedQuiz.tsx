"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Select } from "@/components/ui/Select";
import type { QuizPayload, QuizQuestion } from "@/lib/schemas";

const SECONDS_PER_QUESTION = 30;
const PB_KEY = "mentormind-speed-quiz-pb";

interface SpeedQuizProps {
  topics: { id: string; name: string; subjectName: string }[];
}

type Phase = "setup" | "loading" | "playing" | "results";

export function SpeedQuiz({ topics }: SpeedQuizProps) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [score, setScore] = useState(0);
  const [personalBest, setPersonalBest] = useState(() => {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem(PB_KEY);
    return stored ? Number(stored) || 0 : 0;
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startQuiz = async () => {
    setPhase("loading");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopic,
          query: "Generate a speed quiz with 5 questions",
          mode: "quiz",
          history: [],
        }),
      });
      if (!res.ok) throw new Error("Failed to generate quiz");
      const data = (await res.json()) as { quiz: QuizPayload };
      setQuiz(data.quiz);
      setCurrentQ(0);
      setAnswers([]);
      setScore(0);
      setTimeLeft(SECONDS_PER_QUESTION);
      setPhase("playing");
    } catch {
      setPhase("setup");
    }
  };

  const handleAnswer = useCallback((index: number) => {
    if (!quiz) return;
    const q = quiz.questions[currentQ];
    const newAnswers = [...answers, index];
    const newScore = index === q.correctIndex ? score + 1 : score;
    setAnswers(newAnswers);
    setScore(newScore);

    if (currentQ + 1 >= quiz.questions.length) {
      stopTimer();
      const finalScore = Math.round((newScore / quiz.questions.length) * 100);
      if (finalScore > personalBest) {
        setPersonalBest(finalScore);
        localStorage.setItem(PB_KEY, String(finalScore));
      }
      setPhase("results");

      const topicId = selectedTopic;
      if (topicId) {
        fetch("/api/quiz-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId,
            questions: quiz.questions,
            answers: newAnswers.map((selectedIndex, questionIndex) => ({
              questionIndex,
              selectedIndex: Math.max(0, selectedIndex),
            })),
          }),
        }).catch(() => {});
      }
    } else {
      setCurrentQ(currentQ + 1);
      setTimeLeft(SECONDS_PER_QUESTION);
    }
  }, [quiz, currentQ, answers, score, personalBest, selectedTopic, stopTimer]);

  useEffect(() => {
    if (phase !== "playing") return;
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswer(-1);
          return SECONDS_PER_QUESTION;
        }
        return prev - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, currentQ, handleAnswer, stopTimer]);

  const topicOptions = topics.map((t) => ({
    value: t.id,
    label: `${t.subjectName} — ${t.name}`,
  }));

  if (phase === "setup") {
    return (
      <div className="space-y-4">
        <Select
          label="Topic"
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          options={topicOptions}
          placeholder="Pick a topic..."
        />
        <div className="flex items-center justify-between">
          <Badge tone="brand">Personal Best: {personalBest}%</Badge>
          <Button variant="gradient" disabled={!selectedTopic} onClick={startQuiz}>
            Start Speed Quiz
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="py-12 text-center">
        <ProgressBar value={100} label="Generating quiz..." showValue={false} />
      </div>
    );
  }

  if (phase === "results" && quiz) {
    const pct = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="space-y-6">
        <Card variant="glass" className="text-center">
          <h3 className="text-xl font-bold text-ink-strong">Speed Quiz Complete!</h3>
          <p className="mt-2 text-4xl font-bold text-brand">{pct}%</p>
          <p className="mt-1 text-sm text-ink-muted">
            {score}/{quiz.questions.length} correct
          </p>
          {pct >= personalBest && pct > 0 && (
            <Badge tone="success" className="mt-3">New Personal Best!</Badge>
          )}
        </Card>
        <div className="space-y-3">
          {quiz.questions.map((q: QuizQuestion, i: number) => {
            const userAnswer = answers[i];
            const correct = userAnswer === q.correctIndex;
            return (
              <Card key={i} variant="glass" className="!p-3">
                <div className="flex items-start gap-2">
                  <Badge tone={correct ? "success" : "danger"}>{correct ? "OK" : "X"}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-strong">{q.question}</p>
                    {!correct && (
                      <p className="mt-1 text-xs text-ink-muted">
                        Correct: {q.options[q.correctIndex]}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-ink-faint">{q.explanation}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <Button variant="secondary" onClick={() => setPhase("setup")}>
          Try Another Topic
        </Button>
      </div>
    );
  }

  if (phase === "playing" && quiz) {
    const q = quiz.questions[currentQ];
    const timerPct = (timeLeft / SECONDS_PER_QUESTION) * 100;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Badge tone="neutral">
            Question {currentQ + 1}/{quiz.questions.length}
          </Badge>
          <Badge tone={timeLeft <= 10 ? "danger" : "brand"}>{timeLeft}s</Badge>
        </div>
        <ProgressBar
          value={timerPct}
          showValue={false}
          className="[&>div>div]:!transition-none"
        />
        <Card variant="glass">
          <p className="text-lg font-semibold text-ink-strong">{q.question}</p>
        </Card>
        <div className="grid gap-3 sm:grid-cols-2">
          {q.options.map((opt: string, i: number) => (
            <Button key={i} variant="secondary" onClick={() => handleAnswer(i)}>
              {opt}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
