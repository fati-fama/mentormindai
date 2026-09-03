"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import { RobotIcon } from "@/components/ui/icons";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not create your account. Please try again.");
        return;
      }

      router.push("/onboarding");
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
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-strong">Create your account</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Set up your mentor — it takes less than two minutes a day to keep improving.
          </p>
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
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />

            <Button type="submit" variant="gradient" size="lg" className="w-full" isLoading={isSubmitting} loadingText="Creating account...">
              Create account
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
