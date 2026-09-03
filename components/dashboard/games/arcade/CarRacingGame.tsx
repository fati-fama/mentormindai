"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useGameLoop } from "./useGameLoop";
import { useCanvasSizing, readThemeColors } from "./canvasUtils";
import { getPersonalBest, setPersonalBest } from "@/utils/personalBest";

const PB_KEY = "mentormind-car-pb";
const LANES = 4;
const CAR_W_RATIO = 0.12;
const CAR_H_RATIO = 0.08;
const OBS_W_RATIO = 0.12;
const OBS_H_RATIO = 0.07;

interface Obstacle {
  lane: number;
  y: number;
}

export function CarRacingGame() {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [personalBest, setPB] = useState(() => getPersonalBest(PB_KEY));

  const { canvasRef, resize } = useCanvasSizing();

  const playerLaneRef = useRef(1);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const spawnAccRef = useRef(0);
  const distRef = useRef(0);
  const scoreRef = useRef(0);
  const speedRef = useRef(200);

  const start = useCallback(() => {
    playerLaneRef.current = 1;
    obstaclesRef.current = [];
    spawnAccRef.current = 0;
    distRef.current = 0;
    scoreRef.current = 0;
    speedRef.current = 200;
    setScore(0);
    setGameOver(false);
    setRunning(true);
  }, []);

  useEffect(() => {
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resize]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!running) return;
      if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && playerLaneRef.current > 0) {
        e.preventDefault();
        playerLaneRef.current -= 1;
      }
      if ((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && playerLaneRef.current < LANES - 1) {
        e.preventDefault();
        playerLaneRef.current += 1;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  const tick = useCallback(
    (dt: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      speedRef.current = 200 + distRef.current * 0.05;
      const speed = speedRef.current;

      distRef.current += speed * dt;
      scoreRef.current = Math.floor(distRef.current / 10);
      setScore(scoreRef.current);

      spawnAccRef.current += dt;
      const spawnInterval = Math.max(0.4, 1.2 - distRef.current * 0.0005);
      if (spawnAccRef.current >= spawnInterval) {
        spawnAccRef.current = 0;
        const lane = Math.floor(Math.random() * LANES);
        obstaclesRef.current.push({ lane, y: -OBS_H_RATIO });
      }

      const playerY = 1 - CAR_H_RATIO - 0.02;
      const laneW = w / LANES;
      const carW = w * CAR_W_RATIO;
      const carH = h * CAR_H_RATIO;
      const obsW = w * OBS_W_RATIO;
      const obsH = h * OBS_H_RATIO;

      const dy = (speed / h) * dt;
      obstaclesRef.current = obstaclesRef.current.map((obs) => ({ ...obs, y: obs.y + dy }));

      let collided = false;
      const px = playerLaneRef.current * laneW + (laneW - carW) / 2;
      const py = playerY * h;
      for (const obs of obstaclesRef.current) {
        const ox = obs.lane * laneW + (laneW - obsW) / 2;
        const oy = obs.y * h;
        if (px < ox + obsW && px + carW > ox && py < oy + obsH && py + carH > oy) {
          collided = true;
          break;
        }
      }

      obstaclesRef.current = obstaclesRef.current.filter((o) => o.y < 1.2);

      const colors = readThemeColors();

      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "rgba(255,255,255,0.04)";
      for (let i = 1; i < LANES; i++) {
        const lx = i * laneW;
        const dashH = 20;
        const gap = 15;
        const offset = (distRef.current * 0.5) % (dashH + gap);
        for (let dy = -offset; dy < h; dy += dashH + gap) {
          ctx.fillRect(lx - 1, dy, 2, dashH);
        }
      }

      ctx.fillStyle = colors.brand;
      ctx.beginPath();
      ctx.roundRect(px, py, carW, carH, 4);
      ctx.fill();

      ctx.fillStyle = colors.accent;
      for (const obs of obstaclesRef.current) {
        const ox = obs.lane * laneW + (laneW - obsW) / 2;
        const oy = obs.y * h;
        ctx.beginPath();
        ctx.roundRect(ox, oy, obsW, obsH, 4);
        ctx.fill();
      }

      if (collided) {
        setRunning(false);
        setGameOver(true);
        const best = setPersonalBest(PB_KEY, scoreRef.current);
        setPB(best);
      }
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
          <h3 className="text-sm font-semibold text-ink-strong">Car Racing</h3>
          <Badge tone="neutral">Score: {score}</Badge>
          {personalBest > 0 && <Badge tone="brand">Best: {personalBest}</Badge>}
        </div>
        {!running && (
          <Button size="sm" onClick={start}>
            {gameOver ? "Restart" : "Start"}
          </Button>
        )}
      </div>
      <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-xl bg-space-900/60">
        <canvas ref={canvasRef} className="absolute inset-0" />
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-space-950/60 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-lg font-bold text-ink-strong">Crash!</p>
              <p className="text-sm text-ink-muted">Score: {score}</p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-faint">Arrow keys or A/D to switch lanes</p>
    </Card>
  );
}
