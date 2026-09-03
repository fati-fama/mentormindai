"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useTheme, type Theme } from "@/components/providers/ThemeProvider";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink-strong">{label}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-space-600/40 transition-colors ${
          checked ? "bg-brand" : "bg-space-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 translate-y-0 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsPreferences() {
  const theme = useTheme();
  const [reducedMotion, setReducedMotion] = useState(theme.reducedMotion);
  const [highContrast, setHighContrast] = useState(theme.highContrast);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(
    async (patch: Partial<Theme>) => {
      setError(null);
      try {
        const res = await fetch("/api/theme", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layout: theme.layout,
            primaryColor: theme.primaryColor,
            secondaryColor: theme.secondaryColor,
            blendedPalette: theme.blendedPalette,
            avatarColor: theme.avatarColor,
            highContrast,
            reducedMotion,
            ...patch,
          }),
        });
        if (!res.ok) throw new Error("Failed to save preferences");
      } catch {
        setError("Could not save. Please try again.");
      }
    },
    [theme, highContrast, reducedMotion],
  );

  function handleReducedMotion(v: boolean) {
    setReducedMotion(v);
    save({ reducedMotion: v });
  }

  function handleHighContrast(v: boolean) {
    setHighContrast(v);
    save({ highContrast: v });
  }

  return (
    <Card variant="glass" className="max-w-xl">
      <h2 className="mb-1 text-sm font-semibold text-ink-strong">Preferences</h2>
      <div className="divide-y divide-space-600/30">
        <Toggle
          checked={reducedMotion}
          onChange={handleReducedMotion}
          label="Reduced motion"
          description="Minimises animations throughout the app, including the mentor robot."
        />
        <Toggle
          checked={highContrast}
          onChange={handleHighContrast}
          label="High contrast"
          description="Increases contrast for text and UI elements."
        />
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Card>
  );
}
