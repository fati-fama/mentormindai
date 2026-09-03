"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";

interface FlashCard {
  front: string;
  back: string;
}

interface FlashCardsProps {
  topics: {
    id: string;
    name: string;
    subjectName: string;
    masteryLevel: number;
  }[];
}

function buildCardsFromTopic(topic: { name: string; masteryLevel: number }): FlashCard[] {
  const level = Math.round(topic.masteryLevel);
  return [
    { front: `What is the core concept of ${topic.name}?`, back: `Review your study materials for ${topic.name} to build a solid foundation.` },
    { front: `Current mastery level for ${topic.name}?`, back: `${level}% — ${level < 50 ? "Needs significant practice" : level < 75 ? "Making progress" : "Strong understanding"}.` },
    { front: `Key question: Why does ${topic.name} matter?`, back: `Understanding ${topic.name} builds critical thinking for your exam and real-world applications.` },
    { front: `Common mistake area in ${topic.name}?`, back: `Check your Mistake Bank for patterns. Focus on conceptual understanding over memorization.` },
    { front: `How to apply ${topic.name} practically?`, back: `Try solving problems without looking at solutions first. Explain concepts to someone else.` },
  ];
}

export function FlashCards({ topics }: FlashCardsProps) {
  const [selectedTopic, setSelectedTopic] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [review, setReview] = useState<Set<number>>(new Set());

  const topic = topics.find((t) => t.id === selectedTopic);
  const cards = topic ? buildCardsFromTopic(topic) : [];
  const card = cards[currentIndex];

  const markKnown = () => {
    setKnown((prev) => new Set([...prev, currentIndex]));
    nextCard();
  };

  const markReview = () => {
    setReview((prev) => new Set([...prev, currentIndex]));
    nextCard();
  };

  const nextCard = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, cards.length));
  };

  const topicOptions = topics.map((t) => ({
    value: t.id,
    label: `${t.subjectName} — ${t.name}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Select
          label="Topic"
          value={selectedTopic}
          onChange={(e) => {
            setSelectedTopic(e.target.value);
            setCurrentIndex(0);
            setFlipped(false);
            setKnown(new Set());
            setReview(new Set());
          }}
          options={topicOptions}
          placeholder="Pick a topic..."
          className="flex-1"
        />
        <div className="flex gap-2">
          <Badge tone="success">{known.size} known</Badge>
          <Badge tone="warning">{review.size} review</Badge>
        </div>
      </div>

      {!card ? (
        <Card variant="glass" className="py-12 text-center">
          <p className="text-ink-muted">Select a topic to start flashcard practice.</p>
        </Card>
      ) : (
        <>
          <button
            onClick={() => setFlipped(!flipped)}
            className="w-full"
            style={{ perspective: "1000px" }}
          >
            <div
              className="relative w-full transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front */}
              <Card variant="glass" className="min-h-[200px] flex items-center justify-center" style={{ backfaceVisibility: "hidden" }}>
                <div className="text-center">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand">
                    Card {currentIndex + 1} of {cards.length}
                  </p>
                  <p className="text-lg font-semibold text-ink-strong">{card.front}</p>
                  <p className="mt-3 text-xs text-ink-faint">Click to reveal answer</p>
                </div>
              </Card>
              {/* Back */}
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <Card variant="solid" className="min-h-[200px] flex items-center justify-center">
                  <p className="text-center text-sm text-ink">{card.back}</p>
                </Card>
              </div>
            </div>
          </button>

          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={markReview}>
              Needs Review
            </Button>
            <Button variant="secondary" onClick={() => setFlipped(!flipped)}>
              Flip
            </Button>
            <Button variant="primary" onClick={markKnown}>
              Got It
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
