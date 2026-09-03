"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type ProviderInfo = {
  name: string;
  model: string;
  configured: boolean;
};

type ProviderStatus = {
  providers: ProviderInfo[];
  preferred: string;
  configuredCount: number;
  hasAnyProvider: boolean;
};

const PROVIDER_OPTIONS = [
  { value: "AUTO", label: "Auto (fastest available)", description: "Uses the first available provider with fallback" },
  { value: "OPENAI", label: "OpenAI (GPT-4o mini)", description: "ChatGPT — strong reasoning and explanation" },
  { value: "GROQ", label: "Groq (Llama 3.3 70B)", description: "Ultra-fast inference with open-source model" },
  { value: "GEMINI", label: "Google Gemini 2.0 Flash", description: "Google's fast multimodal model" },
] as const;

export function AiSettingsCard() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [preferred, setPreferred] = useState("AUTO");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ai/providers");
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as ProviderStatus;
        if (!cancelled) {
          setStatus(data);
          setPreferred(data.preferred);
        }
      } catch {
        if (!cancelled) setError("Could not load AI provider status.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const savePreferred = useCallback(async (provider: string) => {
    setPreferred(provider);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      setError("Could not save preference. Please try again.");
    } finally {
      setSaving(false);
    }
  }, []);

  if (loading) {
    return (
      <Card variant="glass" className="max-w-xl">
        <h2 className="mb-3 text-sm font-semibold text-ink-strong">AI Provider</h2>
        <p className="text-sm text-ink-muted">Loading provider status...</p>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="max-w-xl">
      <h2 className="mb-1 text-sm font-semibold text-ink-strong">AI Provider</h2>
      <p className="mb-4 text-xs text-ink-muted">
        Choose which AI model powers your mentor. All providers use the same personalized prompts.
      </p>

      {/* Provider status */}
      <div className="mb-4 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Available providers</p>
        {status?.providers.map((p) => (
          <div key={p.name} className="flex items-center justify-between rounded-lg bg-space-700/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${p.configured ? "bg-success" : "bg-space-600"}`} />
              <span className="text-sm text-ink-strong">{p.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-faint">{p.model}</span>
              <Badge tone={p.configured ? "success" : "neutral"}>
                {p.configured ? "Active" : "No key"}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {!status?.hasAnyProvider && (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3">
          <p className="text-sm text-warning">
            No AI providers are configured. Add at least one API key to your <code className="rounded bg-space-700 px-1.5 py-0.5 text-xs">.env</code> file:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-ink-muted">
            <li><code>OPENAI_API_KEY</code> — Get from <span className="text-ink">platform.openai.com</span></li>
            <li><code>GROQ_API_KEY</code> — Get from <span className="text-ink">console.groq.com</span></li>
            <li><code>GEMINI_API_KEY</code> — Get from <span className="text-ink">aistudio.google.com</span></li>
          </ul>
        </div>
      )}

      {/* Provider selection */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Preferred provider</p>
        {PROVIDER_OPTIONS.map((opt) => {
          const isConfigured = opt.value === "AUTO" || status?.providers.find((p) => p.name === opt.value)?.configured;
          const isSelected = preferred === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              disabled={!isConfigured || saving}
              onClick={() => savePreferred(opt.value)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                isSelected
                  ? "border-brand bg-brand/10"
                  : isConfigured
                    ? "border-glass-border bg-space-700/30 hover:border-glass-border-hover"
                    : "cursor-not-allowed border-space-700 bg-space-800/30 opacity-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink-strong">{opt.label}</span>
                {isSelected && <span className="text-xs text-brand">Selected</span>}
                {!isConfigured && <span className="text-xs text-ink-faint">Unavailable</span>}
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">{opt.description}</p>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-xs text-danger">{error}</p>}
      {saving && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          Saving...
        </p>
      )}
    </Card>
  );
}
