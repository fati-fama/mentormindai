"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/utils";

interface SearchIndexItem {
  type: "page" | "topic";
  label: string;
  href: string;
  subtitle?: string;
}

interface GlobalSearchProps {
  searchIndex: SearchIndexItem[];
}

export function GlobalSearch({ searchIndex }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return searchIndex
      .filter((item) => item.label.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, searchIndex]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) {
        router.push(item.href);
        setIsOpen(false);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  }

  const grouped = useMemo(() => {
    const pages = results.filter((r) => r.type === "page");
    const topics = results.filter((r) => r.type === "topic");
    return { pages, topics };
  }, [results]);

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative">
        <SearchIcon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="w-full rounded-lg border border-space-600/40 bg-space-800/50 py-1.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/50"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-lg border border-space-600/40 bg-space-900 shadow-lg">
          {grouped.pages.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-medium text-ink-faint">Pages</div>
              {grouped.pages.map((item) => {
                const globalIdx = results.indexOf(item);
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors",
                      globalIdx === activeIndex
                        ? "bg-space-700/50 text-ink-strong"
                        : "text-ink-muted hover:bg-space-800/50 hover:text-ink",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
          {grouped.topics.length > 0 && (
            <div className="border-t border-space-600/30">
              <div className="px-3 py-1.5 text-xs font-medium text-ink-faint">Topics</div>
              {grouped.topics.map((item) => {
                const globalIdx = results.indexOf(item);
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors",
                      globalIdx === activeIndex
                        ? "bg-space-700/50 text-ink-strong"
                        : "text-ink-muted hover:bg-space-800/50 hover:text-ink",
                    )}
                  >
                    <div>{item.label}</div>
                    {item.subtitle && (
                      <div className="text-xs text-ink-faint">{item.subtitle}</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
