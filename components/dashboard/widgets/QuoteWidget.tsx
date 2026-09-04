"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RefreshIcon, HeartIcon } from "@/components/ui/icons";

interface QuoteWidgetProps {
  userName: string | null;
  subjectNames: string[];
  overallProgress: number;
}

const BASE_QUOTES = [
  "The expert in anything was once a beginner.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Education is the most powerful weapon which you can use to change the world.",
  "Live as if you were to die tomorrow. Learn as if you were to live forever.",
  "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
  "Learning never exhausts the mind.",
  "The roots of education are bitter, but the fruit is sweet.",
  "Intelligence plus character — that is the goal of true education.",
  "Tell me and I forget, teach me and I may remember, involve me and I learn.",
];

const SUBJECT_QUOTES: Record<string, string[]> = {
  Mathematics: [
    "Mathematics is the queen of the sciences.",
    "Pure mathematics is, in its way, the poetry of logical ideas.",
    "The essence of math is not to make simple things complicated, but to make complicated things simple.",
  ],
  Physics: [
    "Physics is not about how the world is, it's about how we can describe it.",
    "The important thing in science is not so much to obtain new facts as to discover new ways of thinking about them.",
    "Equations are just the boring part of mathematics. I attempt to see things in terms of geometry.",
  ],
  Chemistry: [
    "Chemistry is the science of matter, but biology is the science of life.",
    "The only difference between a chemist and a layman is that the chemist understands the reactions.",
    "Chemists do not starch and collar their scientific theories.",
  ],
  Biology: [
    "Nothing in life is to be feared, it is only to be understood.",
    "The function of the brain is to ensure that the organism survives long enough to reproduce.",
    "Biology is the study of complicated things that have the appearance of having been designed with a purpose.",
  ],
  ComputerScience: [
    "The best way to learn to code is to code.",
    "First, solve the problem. Then, write the code.",
    "Code is like humor. When you have to explain it, it's bad.",
  ],
};

function getQuote(subjectNames: string[]): string {
  const hasSubjectQuotes = subjectNames.length > 0 && Math.random() > 0.3;

  if (hasSubjectQuotes) {
    const randomSubject = subjectNames[Math.floor(Math.random() * subjectNames.length)];
    const subjectKey = Object.keys(SUBJECT_QUOTES).find(
      (key) => randomSubject.toLowerCase().includes(key.toLowerCase())
    );
    if (subjectKey) {
      const quotes = SUBJECT_QUOTES[subjectKey];
      return quotes[Math.floor(Math.random() * quotes.length)];
    }
  }

  return BASE_QUOTES[Math.floor(Math.random() * BASE_QUOTES.length)];
}

export function QuoteWidget({ userName, subjectNames, overallProgress }: QuoteWidgetProps) {
  const [quote, setQuote] = useState(() => getQuote(subjectNames));
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(getQuote(subjectNames));
    }, 30000);
    return () => clearInterval(interval);
  }, [subjectNames]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setQuote(getQuote(subjectNames));
      setIsRefreshing(false);
    }, 300);
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const personalizedGreeting = () => {
    if (overallProgress > 80) return "You're crushing it";
    if (overallProgress > 50) return "Great progress";
    if (overallProgress > 20) return "Keep pushing";
    return "Every expert was once a beginner";
  };

  return (
    <Card variant="glass">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-accent/5" />
      <div className="relative">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
              {personalizedGreeting()}{userName ? `, ${userName}` : ""}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className="h-8 w-8 p-0"
              aria-label="Favorite quote"
            >
              <HeartIcon
                size={16}
                className={isFavorite ? "fill-danger text-danger" : "text-ink-muted"}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              className="h-8 w-8 p-0"
              aria-label="New quote"
            >
              <RefreshIcon size={16} className="text-ink-muted" />
            </Button>
          </div>
        </div>
        <blockquote className="text-lg font-medium leading-relaxed text-ink-strong">
          &ldquo;{quote}&rdquo;
        </blockquote>
        {subjectNames.length > 0 && (
          <p className="mt-3 text-xs text-ink-faint">
            Rotating every 30s &middot; Personalized for {subjectNames.slice(0, 2).join(" & ")}
          </p>
        )}
      </div>
    </Card>
  );
}
