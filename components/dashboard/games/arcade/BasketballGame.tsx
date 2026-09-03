"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useGameLoop } from "./useGameLoop";
import { useCanvasSizing, readThemeColors } from "./canvasUtils";
import { getPersonalBest, setPersonalBest } from "@/utils/personalBest";

const PB_KEY = "mentormind-basketball-pb";
const GRAVITY = 600;
const BALL_R = 14;
const RIM_W = 50;
const RIM_H = 6;
const SHOTS_PER_ROUND = 10;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

export function BasketballGame() {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [personalBest, setPB] = useState(() => getPersonalBest(PB_KEY));

  const { canvasRef, resize } = useCanvasSizing();

  const ballRef = useRef<Ball>({ x: 0, y: 0, vx: 0, vy: 0, active: false });
  const dragRef = useRef<{ startX: number; startY: number; curX: number; curY: number } | null>(null);
  const rimRef = useRef({ x: 0, y: 0, dir: 1 });
  const scoreRef = useRef(0);
  const shotsRef = useRef(0);
  const scoredRef = useRef(false);
  const dimsRef = useRef({ w: 0, h: 0 });

  const resetBall = useCallback(() => {
    const { w, h } = dimsRef.current;
    ballRef.current = { x: w * 0.2, y: h * 0.8, vx: 0, vy: 0, active: false };
  }, []);

  const start = useCallback(() => {
    scoreRef.current = 0;
    shotsRef.current = 0;
    scoredRef.current = false;
    setScore(0);
    setShots(0);
    setGameOver(false);
    resize();
    const dpr = window.devicePixelRatio || 1;
    dimsRef.current = { w: (canvasRef.current?.width ?? 0) / dpr, h: (canvasRef.current?.height ?? 0) / dpr };
    const { w, h } = dimsRef.current;
    rimRef.current = { x: w * 0.7, y: h * 0.3, dir: 1 };
    resetBall();
    setRunning(true);
  }, [resize, canvasRef, resetBall]);

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
      if (!running || ballRef.current.active) return;
      const pos = getPos(e);
      dragRef.current = { startX: pos.x, startY: pos.y, curX: pos.x, curY: pos.y };
      canvas.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const pos = getPos(e);
      dragRef.current.curX = pos.x;
      dragRef.current.curY = pos.y;
    };

    const onUp = () => {
      if (!dragRef.current) return;
      const d = dragRef.current;
      const dx = d.startX - d.curX;
      const dy = d.startY - d.curY;
      const power = Math.min(Math.sqrt(dx * dx + dy * dy), 200);
      if (power > 10) {
        const angle = Math.atan2(dy, dx);
        ballRef.current.vx = Math.cos(angle) * power * 3;
        ballRef.current.vy = Math.sin(angle) * power * 3;
        ballRef.current.active = true;
        scoredRef.current = false;
        shotsRef.current += 1;
        setShots(shotsRef.current);
      }
      dragRef.current = null;
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
      dimsRef.current = { w, h };

      const rim = rimRef.current;
      rim.x += rim.dir * 60 * dt;
      if (rim.x > w * 0.85 || rim.x < w * 0.4) rim.dir *= -1;

      const rimLeft = rim.x - RIM_W / 2;
      const rimRight = rim.x + RIM_W / 2;
      const rimTop = rim.y;

      const ball = ballRef.current;
      if (ball.active) {
        ball.vy += GRAVITY * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (
          !scoredRef.current &&
          ball.x > rimLeft + BALL_R &&
          ball.x < rimRight - BALL_R &&
          ball.y > rimTop - 5 &&
          ball.y < rimTop + 15 &&
          ball.vy > 0
        ) {
          scoredRef.current = true;
          scoreRef.current += 10;
          setScore(scoreRef.current);
        }

        if (ball.y > h + 50 || ball.x < -50 || ball.x > w + 50) {
          if (shotsRef.current >= SHOTS_PER_ROUND) {
            setRunning(false);
            setGameOver(true);
            const best = setPersonalBest(PB_KEY, scoreRef.current);
            setPB(best);
            return;
          }
          resetBall();
        }
      }

      const colors = readThemeColors();
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(rimLeft, rimTop, RIM_W, RIM_H);

      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rimLeft, rimTop);
      ctx.lineTo(rimLeft, rimTop + 30);
      ctx.moveTo(rimRight, rimTop);
      ctx.lineTo(rimRight, rimTop + 30);
      ctx.stroke();

      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rimLeft, rimTop + 30);
      ctx.quadraticCurveTo(rim.x, rimTop + 45, rimRight, rimTop + 30);
      ctx.stroke();

      ctx.fillStyle = colors.brand;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      if (dragRef.current && !ball.active) {
        const d = dragRef.current;
        const dx = d.startX - d.curX;
        const dy = d.startY - d.curY;
        const power = Math.min(Math.sqrt(dx * dx + dy * dy), 200);
        ctx.strokeStyle = `rgba(255,255,255,${0.2 + (power / 200) * 0.4})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x + dx * 0.5, ball.y + dy * 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    },
    [canvasRef, resetBall],
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
          <h3 className="text-sm font-semibold text-ink-strong">Basketball</h3>
          <Badge tone="neutral">Score: {score}</Badge>
          <Badge tone="neutral">{shots}/{SHOTS_PER_ROUND} shots</Badge>
          {personalBest > 0 && <Badge tone="brand">Best: {personalBest}</Badge>}
        </div>
        {!running && (
          <Button size="sm" onClick={start}>
            {gameOver ? "Restart" : "Start"}
          </Button>
        )}
      </div>
      <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-xl bg-space-900/60">
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
      <p className="mt-2 text-xs text-ink-faint">Drag from the ball to aim and release to shoot</p>
    </Card>
  );
}
