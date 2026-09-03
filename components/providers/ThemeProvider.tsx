"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeLayout = "FOCUS" | "CLASSIC" | "COMPACT";

export type Theme = {
  layout: ThemeLayout;
  primaryColor: string;
  secondaryColor: string;
  blendedPalette: string | null;
  avatarColor: string;
  highContrast: boolean;
  reducedMotion: boolean;
};

export const DEFAULT_THEME: Theme = {
  layout: "CLASSIC",
  primaryColor: "#8B5CF6",
  secondaryColor: "#22D3EE",
  blendedPalette: null,
  avatarColor: "#8B5CF6",
  highContrast: false,
  reducedMotion: false,
};

const ThemeContext = createContext<Theme>(DEFAULT_THEME);

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  const num = parseInt(cleaned, 16);
  return { r: (num >> 16) & 0xff, g: (num >> 8) & 0xff, b: num & 0xff };
}

function darken(hex: string, amount = 0.1): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(rgb.r * (1 - amount));
  const g = clamp(rgb.g * (1 - amount));
  const b = clamp(rgb.b * (1 - amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}

function blend(primary: string, secondary: string, steps = 5): string[] {
  const a = hexToRgb(primary);
  const b = hexToRgb(secondary);
  if (!a || !b) return [];
  const out: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    out.push(`#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1).toUpperCase()}`);
  }
  return out;
}

function applyThemeVars(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty("--brand", theme.primaryColor);
  root.style.setProperty("--brand-hover", darken(theme.primaryColor, 0.12));
  root.style.setProperty("--accent", theme.secondaryColor);
  root.style.setProperty("--accent-hover", darken(theme.secondaryColor, 0.12));
  root.style.setProperty("--avatar", theme.avatarColor);
  root.dataset.reducedMotion = theme.reducedMotion ? "true" : "false";
  root.dataset.highContrast = theme.highContrast ? "true" : "false";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/theme");
        if (!res.ok) return;
        const json = (await res.json()) as { theme: Theme | null };
        const data = json.theme;
        if (!data) return;
        if (!cancelled) {
          const next: Theme = {
            ...DEFAULT_THEME,
            ...data,
            blendedPalette: data.blendedPalette ?? null,
            reducedMotion: data.reducedMotion ?? false,
          };
          setTheme(next);
          applyThemeVars(next);
        }
      } catch {
        // Theme fetch failure is non-blocking; defaults apply.
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useBlendedPalette(primary: string, secondary: string, steps = 5): string[] {
  return useMemo(() => blend(primary, secondary, steps), [primary, secondary, steps]);
}
