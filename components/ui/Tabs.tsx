"use client";

import { cn } from "@/utils";
import { useCallback, useRef, type KeyboardEvent } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      const idx = tabs.findIndex((t) => t.id === activeTab);
      let next = -1;
      if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
      else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
      if (next >= 0) {
        e.preventDefault();
        const nextTab = tabs[next];
        onChange(nextTab.id);
        tabRefs.current.get(nextTab.id)?.focus();
      }
    },
    [tabs, activeTab, onChange],
  );

  return (
    <div
      className={cn(
        "flex gap-1 rounded-xl bg-space-800/60 p-1 border border-space-600/30",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
            }}
            onClick={() => onChange(tab.id)}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "bg-brand text-white shadow-sm"
                : "text-ink-muted hover:text-ink hover:bg-space-700/50",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
