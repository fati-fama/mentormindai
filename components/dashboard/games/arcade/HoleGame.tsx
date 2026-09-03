"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useGameLoop } from "./useGameLoop";
import { useCanvasSizing, readThemeColors } from "./canvasUtils";
import { getPersonalBest, setPersonalBest } from "@/utils/personalBest";

const PB_KEY = "mentormind-hole-pb";
const GAME_DURATION = 60;
const INITIAL_RADIUS = 15;
const NUM_BLOBS = 40;

interface Blob {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
}

export function HoleGame() {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [personalBest, setPB] = useState(() => getPersonalBest(PB_KEY));

  const { canvasRef, resize } = useCanvasSizing();

  const playerRef = useRef({ x: 0, y: 0, r: INITIAL_RADIUS });
  const blobsRef = useRef<Blob[]>([]);
  const timeRef = useRef(GAME_DURATION);
  const scoreRef = useRef(0);
  const pointerRef = useRef<{ x: number; y: number; down: boolean }>({ x: 0, y: 0, down: false });

  const spawnBlobs = useCallback((w: number, h: number) => {
    const blobs: Blob[] = [];
    for (let i = 0; i < NUM_BLOBS; i++) {
      const r = 4 + Math.random() * 20;
      blobs.push({
        x: r + Math.random() * (w - r * 2),
        y: r + Math.random() * (h - r * 2),
        r,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
      });
    }
    blobsRef.current = blobs;
  }, []);

  const start = useCallback(() => {
    resize();
    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    playerRef.current = { x: w / 2, y: h / 2, r: INITIAL_RADIUS };
    timeRef.current = GAME_DURATION;
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    spawnBlobs(w, h);
    setRunning(true);
  }, [resize, canvasRef, spawnBlobs]);

  useEffect(() => {
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onDown = (e: PointerEvent) => {
      if (!running) return;
      const pos = getPos(e);
      pointerRef.current = { ...pos, down: true };
      canvas.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!pointerRef.current.down) return;
      const pos = getPos(e);
      pointerRef.current.x = pos.x;
      pointerRef.current.y = pos.y;
    };

    const onUp = () => {
      pointerRef.current.down = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, [running, canvasRef]);

  const tick = useCallback(
    (dt: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      timeRef.current -= dt;
      if (timeRef.current <= 0) {
        timeRef.current = 0;
        setRunning(false);
        setGameOver(true);
        const best = setPersonalBest(PB_KEY, scoreRef.current);
        setPB(best);
        return;
      }
      setTimeLeft(Math.ceil(timeRef.current));

      const player = playerRef.current;
      if (pointerRef.current.down) {
        const dx = pointerRef.current.x - player.x;
        const dy = pointerRef.current.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 2) {
          const speed = Math.min(dist * 5, 400);
          player.x += (dx / dist) * speed * dt;
          player.y += (dy / dist) * speed * dt;
        }
      }

      player.x = Math.max(player.r, Math.min(w - player.r, player.x));
      player.y = Math.max(player.r, Math.min(h - player.r, player.y));

      blobsRef.current = blobsRef.current.map((blob) => {
        let { x, y, vx, vy } = blob;
        x += vx * dt;
        y += vy * dt;
        if (x < blob.r || x > w - blob.r) vx *= -1;
        if (y < blob.r || y > h - blob.r) vy *= -1;
        x = Math.max(blob.r, Math.min(w - blob.r, x));
        y = Math.max(blob.r, Math.min(h - blob.r, y));
        return { x, y, vx, vy, r: blob.r };
      });

      const remaining: Blob[] = [];
      for (const blob of blobsRef.current) {
        const dx = player.x - blob.x;
        const dy = player.y - blob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.r && player.r > blob.r * 1.1) {
          player.r += blob.r * 0.3;
          scoreRef.current += Math.floor(blob.r);
          setScore(scoreRef.current);
        } else {
          remaining.push(blob);
        }
      }
      blobsRef.current = remaining;

      const colors = readThemeColors();
      ctx.clearRect(0, 0, w, h);

      for (const blob of blobsRef.current) {
        const canEat = player.r > blob.r * 1.1;
        ctx.fillStyle = canEat ? colors.accent : "#ef4444";
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = colors.brand;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
      ctx.stroke();
    },
    [canvasRef],
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
          <h3 className="text-sm font-semibold text-ink-strong">Hole</h3>
          <Badge tone="neutral">Score: {score}</Badge>
          <Badge tone={timeLeft <= 10 ? "danger" : "neutral"}>{timeLeft}s</Badge>
          {personalBest > 0 && <Badge tone="brand">Best: {personalBest}</Badge>}
        </div>
        {!running && (
          <Button size="sm" onClick={start}>
            {gameOver ? "Restart" : "Start"}
          </Button>
        )}
      </div>
      <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-xl bg-space-900/60">
        <canvas ref={canvasRef} className="absolute inset-0" />
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-space-950/60 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-lg font-bold text-ink-strong">Time&apos;s Up!</p>
              <p className="text-sm text-ink-muted">Score: {score}</p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-faint">Click and drag to move — absorb smaller circles to grow</p>
    </Card>
  );
}
