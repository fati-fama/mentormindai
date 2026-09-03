"use client";

import { useEffect, useRef } from "react";

type TickFn = (dt: number) => void;

export function useGameLoop(tick: TickFn, running: boolean) {
  const tickRef = useRef<TickFn>(tick);
  const rafRef = useRef(0);
  const prevTimeRef = useRef(0);
  const runningRef = useRef(running);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    if (!running) {
      prevTimeRef.current = 0;
      return;
    }

    prevTimeRef.current = 0;

    function loop(time: number) {
      if (!runningRef.current) return;
      if (prevTimeRef.current === 0) {
        prevTimeRef.current = time;
      }
      const dt = Math.min((time - prevTimeRef.current) / 1000, 0.1);
      prevTimeRef.current = time;
      tickRef.current(dt);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    const onBlur = () => {
      cancelAnimationFrame(rafRef.current);
    };
    const onFocus = () => {
      if (runningRef.current) {
        prevTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [running]);
}
