"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/utils";
import { SidebarNav } from "./SidebarNav";
import { UserProfileCard } from "./UserProfileCard";
import { GlobalSearch } from "./GlobalSearch";
import { MenuIcon, XIcon, LogOutIcon } from "@/components/ui/icons";
import { useTheme } from "@/components/providers/ThemeProvider";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardShell({
  userName,
  educationLevel,
  searchIndex,
  children,
}: {
  userName: string | null;
  educationLevel?: string | null;
  searchIndex: { type: "page" | "topic"; label: string; href: string; subtitle?: string }[];
  children: ReactNode;
}) {
  const router = useRouter();
  const theme = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const layout = theme.layout;
  const sidebarWidth = layout === "FOCUS" ? "w-16" : "w-72";
  const headerHeight = layout === "COMPACT" ? "h-14" : "h-16";
  const mainPadding = layout === "COMPACT" ? "py-4" : "py-6 lg:py-8";
  const mainMaxWidth = layout === "FOCUS" ? "max-w-4xl" : "max-w-7xl";

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar */}
      <aside
        className={cn(
          `fixed inset-y-0 left-0 z-30 flex flex-col border-r border-space-600/40 bg-space-900 transition-transform lg:static lg:translate-x-0`,
          sidebarWidth,
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink-strong">
            <img
              src="/mascot/mentormind-logo.png"
              alt=""
              aria-hidden="true"
              className="h-8 w-8 rounded-full"
            />
            <span>
              MentorMind <span className="text-brand">AI</span>
            </span>
          </Link>
          <button
            type="button"
            className="ml-auto rounded-lg p-1.5 text-ink-muted hover:bg-space-700/50 hover:text-ink lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* User profile */}
        <UserProfileCard name={userName} educationLevel={educationLevel} />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-space-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className={cn("flex items-center justify-between border-b border-space-600/30 bg-space-900/50 px-4 backdrop-blur-sm lg:px-8", headerHeight)}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-1.5 text-ink-muted hover:bg-space-700/50 hover:text-ink lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <MenuIcon size={20} />
            </button>
            <p className="text-sm text-ink-muted">
              {greeting()}, <span className="font-medium text-ink-strong">{userName ?? "Student"}</span>!
            </p>
          </div>
          <GlobalSearch searchIndex={searchIndex} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            isLoading={isSigningOut}
            className="gap-1.5 text-ink-muted"
          >
            <LogOutIcon size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </header>

        <main className={cn("mx-auto w-full flex-1 px-4 lg:px-8", mainMaxWidth, mainPadding)}>
          {children}
        </main>
      </div>
    </div>
  );
}
