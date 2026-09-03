"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import { RobotIcon } from "@/components/ui/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not sign you in. Please try again.");
        return;
      }

      const nextPath = new URLSearchParams(window.location.search).get("next");
      const fallback = data.user.onboardingCompleted ? "/dashboard" : "/onboarding";
      router.push(nextPath?.startsWith("/") ? nextPath : fallback);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20">
              <RobotIcon size={18} className="text-brand" />
            </span>
            <span className="text-ink-strong">
              MentorMind <span className="text-brand">AI</span>
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-strong">Welcome back</h1>
          <p className="mt-2 text-sm text-ink-muted">Sign in to continue with your mentor.</p>
        </div>

        <Card variant="glass" className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
                {error}
              </div>
            )}

            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <Button type="submit" variant="gradient" size="lg" className="w-full" isLoading={isSubmitting} loadingText="Signing in...">
              Sign in
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-ink-muted">
          New to MentorMind?{" "}
          <Link href="/register" className="font-medium text-brand hover:text-brand-hover">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
