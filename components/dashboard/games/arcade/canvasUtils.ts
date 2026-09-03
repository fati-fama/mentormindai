"use client";

import { useRef, useCallback } from "react";

export function useCanvasSizing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  return { canvasRef, resize };
}

export function readThemeColors(): { brand: string; accent: string } {
  const style = getComputedStyle(document.documentElement);
  return {
    brand: style.getPropertyValue("--brand").trim() || "#8b5cf6",
    accent: style.getPropertyValue("--accent").trim() || "#06b6d4",
  };
}
