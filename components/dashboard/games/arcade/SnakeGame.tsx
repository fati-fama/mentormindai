"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useGameLoop } from "./useGameLoop";
import { useCanvasSizing, readThemeColors } from "./canvasUtils";
import { getPersonalBest, setPersonalBest } from "@/utils/personalBest";

const PB_KEY = "mentormind-snake-pb";
const GRID = 20;
const BASE_SPEED = 8;

interface Point {
  x: number;
  y: number;
}

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

const DIR_VEC: Record<Dir, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const OPPOSITES: Record<Dir, Dir> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

export function SnakeGame() {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [personalBest, setPB] = useState(() => getPersonalBest(PB_KEY));

  const { canvasRef, resize } = useCanvasSizing();

  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const dirRef = useRef<Dir>("RIGHT");
  const nextDirRef = useRef<Dir>("RIGHT");
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const accRef = useRef(0);
  const scoreRef = useRef(0);
  const cellRef = useRef(0);

  const placeFood = useCallback(() => {
    const snake = snakeRef.current;
    let p: Point;
    do {
      p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (snake.some((s) => s.x === p.x && s.y === p.y));
    foodRef.current = p;
  }, []);

  const start = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = "RIGHT";
    nextDirRef.current = "RIGHT";
    accRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    placeFood();
    setRunning(true);
  }, [placeFood]);

  useEffect(() => {
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resize]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      let newDir: Dir | null = null;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          newDir = "UP";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          newDir = "DOWN";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          newDir = "LEFT";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          newDir = "RIGHT";
          break;
      }
      if (newDir && newDir !== OPPOSITES[dirRef.current]) {
        e.preventDefault();
        nextDirRef.current = newDir;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tick = useCallback(
    (dt: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cell = Math.floor(Math.min(w, h) / GRID);
      cellRef.current = cell;

      accRef.current += dt;
      const interval = 1 / BASE_SPEED;

      if (accRef.current >= interval) {
        accRef.current -= interval;
        dirRef.current = nextDirRef.current;

        const snake = snakeRef.current;
        const head = snake[0];
        const vec = DIR_VEC[dirRef.current];
        const newHead: Point = { x: head.x + vec.x, y: head.y + vec.y };

        if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
          setRunning(false);
          setGameOver(true);
          const best = setPersonalBest(PB_KEY, scoreRef.current);
          setPB(best);
          return;
        }

        if (snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
          setRunning(false);
          setGameOver(true);
          const best = setPersonalBest(PB_KEY, scoreRef.current);
          setPB(best);
          return;
        }

        const ate = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y;
        const newSnake = [newHead, ...snake];
        if (!ate) {
          newSnake.pop();
        } else {
          scoreRef.current += 10;
          setScore(scoreRef.current);
          placeFood();
        }
        snakeRef.current = newSnake;
      }

      const colors = readThemeColors();
      const ox = (w - cell * GRID) / 2;
      const oy = (h - cell * GRID) / 2;

      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "rgba(255,255,255,0.03)";
      for (let gx = 0; gx < GRID; gx++) {
        for (let gy = 0; gy < GRID; gy++) {
          ctx.fillRect(ox + gx * cell + 1, oy + gy * cell + 1, cell - 2, cell - 2);
        }
      }

      const food = foodRef.current;
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(ox + food.x * cell + cell / 2, oy + food.y * cell + cell / 2, cell / 2.5, 0, Math.PI * 2);
      ctx.fill();

      const snake = snakeRef.current;
      snake.forEach((seg, i) => {
        const t = 1 - i / snake.length;
        ctx.fillStyle = i === 0 ? colors.brand : colors.brand;
        ctx.globalAlpha = 0.4 + 0.6 * t;
        const pad = i === 0 ? 1 : 2;
        ctx.beginPath();
        ctx.roundRect(ox + seg.x * cell + pad, oy + seg.y * cell + pad, cell - pad * 2, cell - pad * 2, 3);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    },
    [canvasRef, placeFood],
  );

  useGameLoop(tick, running);

  useEffect(() => {
    if (!running && !gameOver) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      resize();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Press Start to play", w / 2, h / 2);
    }
  }, [running, gameOver, canvasRef, resize]);

  return (
    <Card variant="glass">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-ink-strong">Snake</h3>
          <Badge tone="neutral">Score: {score}</Badge>
          {personalBest > 0 && <Badge tone="brand">Best: {personalBest}</Badge>}
        </div>
        <div className="flex gap-2">
          {!running && (
            <Button size="sm" onClick={start}>
              {gameOver ? "Restart" : "Start"}
            </Button>
          )}
        </div>
      </div>
      <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-xl bg-space-900/60">
        <canvas ref={canvasRef} className="absolute inset-0" />
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-space-950/60 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-lg font-bold text-ink-strong">Game Over</p>
              <p className="text-sm text-ink-muted">Score: {score}</p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-faint">Arrow keys or WASD to move</p>
    </Card>
  );
}
