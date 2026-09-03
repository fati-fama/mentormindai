"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { GamesIcon } from "@/components/ui/icons";
import { FlashCards } from "./FlashCards";
import { SpeedQuiz } from "./SpeedQuiz";
import { SnakeGame } from "./arcade/SnakeGame";
import { CarRacingGame } from "./arcade/CarRacingGame";
import { BasketballGame } from "./arcade/BasketballGame";
import { HoleGame } from "./arcade/HoleGame";
import { getPersonalBest } from "@/utils/personalBest";

interface TopicOption {
  id: string;
  name: string;
  subjectName: string;
  masteryLevel: number;
}

interface GamesHubProps {
  topics: TopicOption[];
}

export function GamesHub({ topics }: GamesHubProps) {
  const [activeTab, setActiveTab] = useState("flash-cards");
  const [speedQuizPB] = useState(() => getPersonalBest("mentormind-speed-quiz-pb"));

  const tabs = [
    { id: "flash-cards", label: "Flash Cards" },
    { id: "speed-quiz", label: "Speed Quiz" },
    { id: "snake", label: "Snake" },
    { id: "car-racing", label: "Car Racing" },
    { id: "basketball", label: "Basketball" },
    { id: "hole", label: "Hole" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Study Games</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Card variant="glass" interactive onClick={() => setActiveTab("flash-cards")}>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15">
                <GamesIcon size={24} className="text-brand" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink-strong">Flash Cards</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Flip through topic cards to test recall. Mark known vs needs-review.
                </p>
              </div>
            </div>
          </Card>
          <Card variant="glass" interactive onClick={() => setActiveTab("speed-quiz")}>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                <GamesIcon size={24} className="text-accent" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink-strong">Speed Quiz</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  30 seconds per question. Race the clock and beat your personal best.
                </p>
                {speedQuizPB > 0 && (
                  <Badge tone="brand" className="mt-2">Best: {speedQuizPB}%</Badge>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Study Break</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="glass" interactive onClick={() => setActiveTab("snake")}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/15">
                <GamesIcon size={20} className="text-brand" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-strong">Snake</h3>
                <p className="mt-0.5 text-xs text-ink-muted">Classic grid snake</p>
              </div>
            </div>
          </Card>
          <Card variant="glass" interactive onClick={() => setActiveTab("car-racing")}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                <GamesIcon size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-strong">Car Racing</h3>
                <p className="mt-0.5 text-xs text-ink-muted">Dodge traffic</p>
              </div>
            </div>
          </Card>
          <Card variant="glass" interactive onClick={() => setActiveTab("basketball")}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/15">
                <GamesIcon size={20} className="text-brand" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-strong">Basketball</h3>
                <p className="mt-0.5 text-xs text-ink-muted">Drag to shoot</p>
              </div>
            </div>
          </Card>
          <Card variant="glass" interactive onClick={() => setActiveTab("hole")}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                <GamesIcon size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-strong">Hole</h3>
                <p className="mt-0.5 text-xs text-ink-muted">Absorb and grow</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div>
        {activeTab === "flash-cards" && (
          <FlashCards
            topics={topics.map((t) => ({
              id: t.id,
              name: t.name,
              subjectName: t.subjectName,
              masteryLevel: t.masteryLevel,
            }))}
          />
        )}
        {activeTab === "speed-quiz" && (
          <SpeedQuiz
            topics={topics.map((t) => ({
              id: t.id,
              name: t.name,
              subjectName: t.subjectName,
            }))}
          />
        )}
        {activeTab === "snake" && <SnakeGame />}
        {activeTab === "car-racing" && <CarRacingGame />}
        {activeTab === "basketball" && <BasketballGame />}
        {activeTab === "hole" && <HoleGame />}
      </div>
    </div>
  );
}
