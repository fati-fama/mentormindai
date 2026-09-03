"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui";

export function DashboardHeader({ userName }: { userName: string | null }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="h-7 w-7">
            <img src="/mascot/mentormind-logo.png" alt="" aria-hidden="true" className="h-7 w-7 rounded-full" />
          </span>
          <span>
            MentorMind <span className="text-[var(--brand)]">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-600">{userName ?? "Student"}</span>
          <Button variant="secondary" size="sm" onClick={handleSignOut} isLoading={isSigningOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
