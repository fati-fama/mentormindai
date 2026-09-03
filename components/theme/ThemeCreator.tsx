"use client";

import { useState, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { useTheme, DEFAULT_THEME, useBlendedPalette, type ThemeLayout } from "@/components/providers/ThemeProvider";
import { WhiteRobot } from "@/components/robot/WhiteRobot";

const LAYOUT_OPTIONS: { value: ThemeLayout; label: string; desc: string }[] = [
  { value: "FOCUS", label: "Focus", desc: "Minimal sidebar, distraction-free" },
  { value: "CLASSIC", label: "Classic", desc: "Standard layout with full navigation" },
  { value: "COMPACT", label: "Compact", desc: "Dense layout for smaller screens" },
];

const COSMIC_PRESETS = [
  { label: "Cosmic Purple", primary: "#8B5CF6", secondary: "#22D3EE" },
  { label: "Nebula Rose", primary: "#EC4899", secondary: "#F59E0B" },
  { label: "Aurora Green", primary: "#10B981", secondary: "#6366F1" },
  { label: "Solar Flare", primary: "#F97316", secondary: "#3B82F6" },
];

function relativeLuminance(hex: string): number {
  const cleaned = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return 0;
  const num = parseInt(cleaned, 16);
  const r = ((num >> 16) & 0xff) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;
  const srgb = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

function pickTextColor(bg: string): string {
  return relativeLuminance(bg) > 0.4 ? "#1E293B" : "#FFFFFF";
}

export function ThemeCreator() {
  const current = useTheme();

  const [activeTab, setActiveTab] = useState("colors");
  const [layout, setLayout] = useState<ThemeLayout>(current.layout);
  const [primary, setPrimary] = useState(current.primaryColor);
  const [secondary, setSecondary] = useState(current.secondaryColor);
  const [avatarColor, setAvatarColor] = useState(current.avatarColor);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false);
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const palette = useBlendedPalette(primary, secondary);
  const ratio = contrastRatio(primary, secondary);
  const passContrast = ratio >= 3;

  const handleSave = useCallback(async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout,
          primaryColor: primary,
          secondaryColor: secondary,
          avatarColor,
          blendedPalette: palette.join(","),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.contrastWarning) {
          setStatus(`Contrast ratio ${data.contrastWarning.ratio}:1 — consider adjusting colors for accessibility.`);
        } else {
          setStatus("Theme saved. Refresh to see it everywhere.");
        }
        const root = document.documentElement;
        root.style.setProperty("--brand", primary);
        root.style.setProperty("--accent", secondary);
        root.style.setProperty("--avatar", avatarColor);
      } else {
        const err = await res.json();
        setStatus(err.error ?? "Could not save theme.");
      }
    } catch {
      setStatus("Connection lost. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [layout, primary, secondary, avatarColor, palette]);

  const handleReset = useCallback(async () => {
    setResetting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/theme", { method: "POST" });
      if (res.ok) {
        setLayout(DEFAULT_THEME.layout);
        setPrimary(DEFAULT_THEME.primaryColor);
        setSecondary(DEFAULT_THEME.secondaryColor);
        setAvatarColor(DEFAULT_THEME.avatarColor);
        const root = document.documentElement;
        root.style.setProperty("--brand", DEFAULT_THEME.primaryColor);
        root.style.setProperty("--accent", DEFAULT_THEME.secondaryColor);
        root.style.setProperty("--avatar", DEFAULT_THEME.avatarColor);
        setStatus("Theme reset to defaults.");
      }
    } catch {
      setStatus("Connection lost.");
    } finally {
      setResetting(false);
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-ink-strong">Theme Creator</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Customize your mentor&apos;s look. Colors apply everywhere once saved.
        </p>
      </div>

      <div className="mt-4">
        <Tabs
          tabs={[
            { id: "colors", label: "Colors" },
            { id: "layout", label: "Layout" },
            { id: "preview", label: "Preview" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {activeTab === "layout" && (
            <Card variant="glass">
              <h2 className="text-sm font-semibold text-ink-strong">Layout</h2>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {LAYOUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLayout(opt.value)}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      layout === opt.value
                        ? "border-brand bg-brand/10 ring-1 ring-brand"
                        : "border-glass-border hover:border-glass-border-hover"
                    }`}
                  >
                    <p className="font-medium text-ink-strong">{opt.label}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "colors" && (
            <Card variant="glass">
              <h2 className="text-sm font-semibold text-ink-strong">Colors</h2>

              {/* Preset swatches */}
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium text-ink-faint">Presets</p>
                <div className="flex gap-2">
                  {COSMIC_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => { setPrimary(preset.primary); setSecondary(preset.secondary); }}
                      className="flex items-center gap-1.5 rounded-lg border border-glass-border px-2 py-1.5 text-xs text-ink-muted transition-colors hover:border-glass-border-hover"
                      title={preset.label}
                    >
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium text-ink-faint">Primary</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowPrimaryPicker(!showPrimaryPicker); setShowSecondaryPicker(false); setShowAvatarPicker(false); }}
                      className="flex h-10 w-full items-center gap-2 rounded-lg border border-glass-border bg-space-700/60 px-3"
                    >
                      <span className="h-6 w-6 rounded border border-glass-border" style={{ backgroundColor: primary }} />
                      <span className="text-sm font-mono text-ink-muted">{primary}</span>
                    </button>
                    {showPrimaryPicker && (
                      <div className="absolute z-10 mt-2">
                        <HexColorPicker color={primary} onChange={setPrimary} />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-ink-faint">Secondary</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowSecondaryPicker(!showSecondaryPicker); setShowPrimaryPicker(false); setShowAvatarPicker(false); }}
                      className="flex h-10 w-full items-center gap-2 rounded-lg border border-glass-border bg-space-700/60 px-3"
                    >
                      <span className="h-6 w-6 rounded border border-glass-border" style={{ backgroundColor: secondary }} />
                      <span className="text-sm font-mono text-ink-muted">{secondary}</span>
                    </button>
                    {showSecondaryPicker && (
                      <div className="absolute z-10 mt-2">
                        <HexColorPicker color={secondary} onChange={setSecondary} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-ink-faint">Avatar Color</p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setShowAvatarPicker(!showAvatarPicker); setShowPrimaryPicker(false); setShowSecondaryPicker(false); }}
                    className="flex h-10 w-40 items-center gap-2 rounded-lg border border-glass-border bg-space-700/60 px-3"
                  >
                    <span className="h-6 w-6 rounded border border-glass-border" style={{ backgroundColor: avatarColor }} />
                    <span className="text-sm font-mono text-ink-muted">{avatarColor}</span>
                  </button>
                  {showAvatarPicker && (
                    <div className="absolute z-10 mt-2">
                      <HexColorPicker color={avatarColor} onChange={setAvatarColor} />
                    </div>
                  )}
                </div>
              </div>

              {palette.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-ink-faint">Blended Palette</p>
                  <div className="flex gap-1">
                    {palette.map((c, i) => (
                      <div key={i} className="h-8 flex-1 rounded" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${passContrast ? "bg-success" : "bg-warning"}`}
                />
                <span className="text-xs text-ink-faint">
                  Contrast ratio: {ratio.toFixed(2)}:1
                  {passContrast ? " (passes WCAG AA)" : " (below WCAG AA — text may be hard to read)"}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-success" />
                <span className="text-xs text-ink-faint">Contrast guard enabled</span>
              </div>
            </Card>
          )}

          {activeTab === "preview" && (
            <Card variant="glass">
              <h2 className="text-sm font-semibold text-ink-strong">Live Preview</h2>
              <div className="mt-3 space-y-3">
                <div className="rounded-lg p-4" style={{ backgroundColor: primary }}>
                  <p className="text-sm font-semibold" style={{ color: pickTextColor(primary) }}>
                    Sample Card Title
                  </p>
                  <p className="mt-1 text-xs" style={{ color: pickTextColor(primary), opacity: 0.85 }}>
                    This is how your primary color looks with text on it.
                  </p>
                  <button
                    type="button"
                    className="mt-2 rounded-md px-3 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: secondary, color: pickTextColor(secondary) }}
                  >
                    Action Button
                  </button>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-glass-border p-3">
                  <WhiteRobot mood="HAPPY" className="h-12 w-12" />
                  <div>
                    <p className="text-sm font-medium text-ink-strong">Your Mentor</p>
                    <p className="text-xs text-ink-faint">Avatar color preview</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card variant="glass">
            <h2 className="text-sm font-semibold text-ink-strong">Live Preview</h2>
            <div className="mt-3 space-y-3">
              <div className="rounded-lg p-4" style={{ backgroundColor: primary }}>
                <p className="text-sm font-semibold" style={{ color: pickTextColor(primary) }}>
                  Sample Card Title
                </p>
                <p className="mt-1 text-xs" style={{ color: pickTextColor(primary), opacity: 0.85 }}>
                  This is how your primary color looks with text on it.
                </p>
                <button
                  type="button"
                  className="mt-2 rounded-md px-3 py-1.5 text-xs font-medium"
                  style={{ backgroundColor: secondary, color: pickTextColor(secondary) }}
                >
                  Action Button
                </button>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-glass-border p-3">
                <WhiteRobot mood="HAPPY" className="h-12 w-12" />
                <div>
                  <p className="text-sm font-medium text-ink-strong">Your Mentor</p>
                  <p className="text-xs text-ink-faint">Avatar color preview</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSave} isLoading={saving}>
              Save Theme
            </Button>
            <Button variant="secondary" onClick={handleReset} isLoading={resetting}>
              Reset to Default
            </Button>
          </div>
          {status && (
            <p className="text-sm text-ink-muted">{status}</p>
          )}
        </div>
      </div>
    </div>
  );
}
